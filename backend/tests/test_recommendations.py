from datetime import datetime, timezone
import pytest
from app.schemas import Garment, RecommendationRequest
from app.services.recommendations import recommend
from app.services.vision import YoloDetector


def clothes():
    return [Garment(id=str(i), name=c, category=c, tags=["正式"], created_at=datetime.now(timezone.utc))
            for i, c in enumerate(["上装", "下装", "鞋子", "连衣裙"])]


def test_rules_rank_preferences_and_support_dresses():
    garments = clothes()
    garments[0].tags = ["正式", "商务"]
    result = recommend(RecommendationRequest(occasion="interview"), garments)
    assert result.outfits[0].garment_ids == ["0", "1", "2"]
    assert any(o.garment_ids == ["3", "2"] for o in result.outfits)
    assert result.outfits[0].score >= result.outfits[1].score


@pytest.mark.parametrize("ids", [["invented", "2"], ["0", "0", "2"], ["0", "2"], ["0", "1", "2", "3"]])
def test_invalid_llm_ids_and_combinations_fall_back(ids):
    class Invalid:
        def recommend(self, request, garments):
            return [{"name": "invalid", "garment_ids": ids, "score": 90, "reason": "x"}]
    result = recommend(RecommendationRequest(), clothes(), Invalid())
    assert result.source == "rules"
    assert result.fallback_reason == "llm_unavailable_or_invalid"
    assert result.outfits


def test_timeout_falls_back():
    class Slow:
        def recommend(self, request, garments):
            raise TimeoutError()
    assert recommend(RecommendationRequest(), clothes(), Slow()).source == "rules"


def test_yolo_does_not_download_weights():
    with pytest.raises(ValueError, match="existing local"):
        YoloDetector("not-a-real-weight.pt", False)
