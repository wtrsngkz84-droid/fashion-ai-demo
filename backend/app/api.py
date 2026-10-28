from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from starlette.concurrency import run_in_threadpool
from .schemas import (Garment, GarmentCreate, GarmentPatch, Recommendation, RecommendationRequest,
                      HistoryCreate, HistoryRecord, Feedback, FeedbackCreate, VisionResult)
from .services.recommendations import recommend
from .services.vision import MAX_BYTES, InvalidImage

router = APIRouter(prefix="/api/v1")


def required(repo, table, key):
    result = repo.get(table, key)
    if result is None:
        raise HTTPException(404, "记录不存在")
    return result


def selected(repo, rec_id, index):
    rec = Recommendation.model_validate(required(repo, "recommendations", rec_id))
    if index >= len(rec.outfits):
        raise HTTPException(422, "方案索引无效")
    return rec, rec.outfits[index]


@router.get("/garments", response_model=list[Garment])
def garments(request: Request):
    return request.app.state.repo.list("garments")


@router.post("/garments", response_model=Garment, status_code=201)
def create_garment(body: GarmentCreate, request: Request):
    return request.app.state.repo.save("garments", Garment(
        **body.model_dump(), id=str(uuid4()), created_at=datetime.now(timezone.utc)))


@router.patch("/garments/{garment_id}", response_model=Garment)
def update_garment(garment_id: str, body: GarmentPatch, request: Request):
    repo = request.app.state.repo
    record = Garment.model_validate(required(repo, "garments", garment_id))
    return repo.save("garments", record.model_copy(update=body.model_dump()))


@router.delete("/garments/{garment_id}", status_code=204)
def delete_garment(garment_id: str, request: Request):
    if not request.app.state.repo.delete("garments", garment_id):
        raise HTTPException(404, "衣物不存在")


@router.post("/recommendations", response_model=Recommendation, status_code=201)
def create_recommendation(body: RecommendationRequest, request: Request):
    repo = request.app.state.repo
    result = recommend(body, [Garment.model_validate(g) for g in repo.list("garments")],
                       request.app.state.recommender)
    return repo.save("recommendations", result)


@router.get("/history", response_model=list[HistoryRecord])
def history(request: Request):
    return request.app.state.repo.list("history")


@router.post("/history", response_model=HistoryRecord, status_code=201)
def save_history(body: HistoryCreate, request: Request):
    repo = request.app.state.repo
    rec, outfit = selected(repo, body.recommendation_id, body.outfit_index)
    current = [repo.get("garments", key) for key in outfit.garment_ids]
    if any(g is None or g["status"] != "clean" for g in current):
        raise HTTPException(409, "衣物已删除或不可穿，请重新推荐")
    return repo.save("history", HistoryRecord(
        id=str(uuid4()), recommendation_id=rec.id, occasion=rec.occasion, outfit=outfit,
        garments=current, saved_at=datetime.now(timezone.utc)))


@router.delete("/history/{record_id}", status_code=204)
def delete_history(record_id: str, request: Request):
    if not request.app.state.repo.delete("history", record_id):
        raise HTTPException(404, "记录不存在")


@router.post("/feedback", response_model=Feedback, status_code=201)
def save_feedback(body: FeedbackCreate, request: Request):
    repo = request.app.state.repo
    selected(repo, body.recommendation_id, body.outfit_index)
    return repo.save("feedback", Feedback(**body.model_dump(), id=str(uuid4()),
                                          created_at=datetime.now(timezone.utc)))


@router.get("/feedback", response_model=list[Feedback])
def feedback(request: Request):
    return request.app.state.repo.list("feedback")


@router.post("/vision/analyze", response_model=VisionResult)
async def analyze(request: Request, image: UploadFile = File(...)):
    try:
        if image.content_type not in {"image/jpeg", "image/png"}:
            raise HTTPException(415, "仅支持 JPEG/PNG")
        raw = await image.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise HTTPException(413, "图片不能超过 5 MiB")
        return await run_in_threadpool(request.app.state.vision.analyze, raw)
    except InvalidImage as exc:
        raise HTTPException(422, str(exc)) from exc
    finally:
        await image.close()
