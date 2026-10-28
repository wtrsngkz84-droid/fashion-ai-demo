import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import create_app
from app.settings import Settings


@pytest.fixture
def settings(tmp_path):
    return Settings(database=str(tmp_path / "test.sqlite3"), token="test-token")


@pytest.fixture
def client(settings):
    with TestClient(create_app(settings)) as client:
        client.headers["Authorization"] = "Bearer test-token"
        yield client


def seed(client):
    result = []
    for name, category in [("白T", "上装"), ("牛仔裤", "下装"), ("运动鞋", "鞋子")]:
        res = client.post("/api/v1/garments", json={"name": name, "category": category, "tags": ["通勤"]})
        assert res.status_code == 201
        result.append(res.json())
    return result


def recommendation(client):
    res = client.post("/api/v1/recommendations", json={"occasion": "daily"})
    assert res.status_code == 201
    return res.json()


def test_full_loop_and_restart(client, settings):
    garments = seed(client)
    rec = recommendation(client)
    assert rec["source"] == "rules"
    assert set(rec["outfits"][0]["garment_ids"]) == {g["id"] for g in garments}
    chosen = {"recommendation_id": rec["id"], "outfit_index": 0}
    history = client.post("/api/v1/history", json=chosen)
    assert history.status_code == 201
    assert client.post("/api/v1/feedback", json={**chosen, "rating": "like"}).status_code == 201
    with TestClient(create_app(settings)) as restarted:
        restarted.headers["Authorization"] = "Bearer test-token"
        assert len(restarted.get("/api/v1/garments").json()) == 3
        assert len(restarted.get("/api/v1/history").json()) == 1
        assert restarted.get("/api/v1/feedback").json()[0]["rating"] == "like"
    assert client.delete("/api/v1/garments/" + garments[0]["id"]).status_code == 204
    assert client.post("/api/v1/history", json=chosen).status_code == 409
    # Historical snapshot survives deletion of the source garment.
    assert len(client.get("/api/v1/history").json()[0]["garments"]) == 3
    assert client.delete("/api/v1/history/" + history.json()["id"]).status_code == 204
    assert client.get("/api/v1/history").json() == []


def test_dirty_items_and_empty_wardrobe(client):
    assert recommendation(client)["outfits"] == []
    garments = seed(client)
    assert client.patch("/api/v1/garments/" + garments[0]["id"], json={"status": "dirty"}).status_code == 200
    result = recommendation(client)
    assert not result["outfits"] and result["warnings"]


@pytest.mark.parametrize("body", [
    {"name": " ", "category": "上装"}, {"name": "T", "category": "unknown"},
    {"name": "T", "category": "上装", "color_hex": "red;display:none"},
    {"name": "T", "category": "上装", "owner_id": "other"},
], ids=["blank-name", "unknown-category", "invalid-color", "unexpected-owner"])
def test_validation(client, body):
    assert client.post("/api/v1/garments", json=body).status_code == 422


def test_auth_and_production_guard(settings):
    with TestClient(create_app(settings)) as client:
        assert client.get("/healthz").status_code == 200
        assert client.get("/api/v1/garments").status_code == 401
        assert client.get("/api/v1/garments", headers={"Authorization": "Bearer wrong"}).status_code == 401
    with pytest.raises(RuntimeError, match="Production"):
        create_app(Settings(mode="production"))


def test_stale_selection_and_invalid_feedback(client):
    garments = seed(client)
    rec = recommendation(client)
    chosen = {"recommendation_id": rec["id"], "outfit_index": 0}
    assert client.post("/api/v1/history", json={**chosen, "outfit_index": 4}).status_code == 422
    assert client.post("/api/v1/feedback", json={**chosen, "recommendation_id": "invented", "rating": "like"}).status_code == 404
    client.patch("/api/v1/garments/" + garments[0]["id"], json={"status": "washing"})
    assert client.post("/api/v1/history", json=chosen).status_code == 409


def image_bytes():
    image = Image.new("RGB", (32, 24), (255, 0, 0))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_opencv_pipeline_without_weights(client):
    res = client.post("/api/v1/vision/analyze", files={"image": ("red.png", image_bytes(), "image/png")})
    assert res.status_code == 200
    data = res.json()
    assert (data["width"], data["height"], data["dominant_color"]) == (32, 24, "#FF0000")
    assert data["provider"] == "opencv-only" and data["detections"] == []
    assert data["status"] == "needs_confirmation"
    assert client.get("/api/v1/garments").json() == []  # analysis cannot silently create clothes


@pytest.mark.parametrize("raw,mime,code", [
    (b"not an image", "image/png", 422), (b"<svg/>", "image/svg+xml", 415),
    (b"0" * (5 * 1024 * 1024 + 1), "image/png", 413),
], ids=["corrupt", "unsupported-type", "oversized"])
def test_bad_uploads(client, raw, mime, code):
    assert client.post("/api/v1/vision/analyze", files={"image": ("bad", raw, mime)}).status_code == code


def test_pixel_limit(client):
    buffer = io.BytesIO()
    Image.new("RGB", (4000, 3100)).save(buffer, format="PNG")
    res = client.post("/api/v1/vision/analyze", files={"image": ("big.png", buffer.getvalue(), "image/png")})
    assert res.status_code == 422


def test_yolo_failure_falls_back(settings):
    class Broken:
        def detect(self, image):
            raise RuntimeError("private model path")
    with TestClient(create_app(settings, detector=Broken())) as client:
        client.headers["Authorization"] = "Bearer test-token"
        res = client.post("/api/v1/vision/analyze", files={"image": ("red.png", image_bytes(), "image/png")})
        assert res.status_code == 200
        assert res.json()["detections"] == []
        assert "private model path" not in res.text
        assert "YOLO 推理失败" in res.json()["warnings"][-1]


def test_openapi_exposes_contract(client):
    schema = client.get("/openapi.json").json()
    assert "VisionResult" in schema["components"]["schemas"]
    assert "/api/v1/feedback" in schema["paths"]
