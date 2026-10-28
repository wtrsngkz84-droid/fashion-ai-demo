from datetime import datetime
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
Category = Literal["上装", "下装", "鞋子", "连衣裙", "外套", "首饰"]
Status = Literal["clean", "dirty", "washing"]
Occasion = Literal["daily", "interview", "date", "sports", "party", "business"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class GarmentCreate(StrictModel):
    name: Text
    category: Category
    color: Text = "未指定"
    color_hex: str = Field(default="#9E9E9E", pattern=r"^#[0-9a-fA-F]{6}$")
    brand: str = Field(default="", max_length=80)
    tags: list[Text] = Field(default_factory=list, max_length=12)
    status: Status = "clean"


class Garment(GarmentCreate):
    id: str
    created_at: datetime


class GarmentPatch(StrictModel):
    status: Status


class RecommendationRequest(StrictModel):
    occasion: Occasion = "daily"
    preferences: list[Text] = Field(default_factory=list, max_length=12)
    limit: int = Field(default=3, ge=1, le=5)


class Outfit(StrictModel):
    garment_ids: list[str] = Field(min_length=2, max_length=5)
    name: str
    score: float = Field(ge=0, le=100)
    reason: str


class Recommendation(StrictModel):
    id: str
    occasion: Occasion
    source: Literal["rules", "llm"]
    fallback_reason: str | None = None
    outfits: list[Outfit]
    warnings: list[str] = Field(default_factory=list)
    created_at: datetime


class HistoryCreate(StrictModel):
    recommendation_id: str
    outfit_index: int = Field(ge=0, le=4)


class HistoryRecord(StrictModel):
    id: str
    recommendation_id: str
    occasion: Occasion
    outfit: Outfit
    garments: list[Garment]
    saved_at: datetime


class FeedbackCreate(StrictModel):
    recommendation_id: str
    outfit_index: int = Field(ge=0, le=4)
    rating: Literal["like", "dislike", "worn"]
    note: str = Field(default="", max_length=300)


class Feedback(FeedbackCreate):
    id: str
    created_at: datetime


class Detection(StrictModel):
    category: Category
    confidence: float = Field(ge=0, le=1)
    bbox: list[int] = Field(min_length=4, max_length=4)


class VisionResult(StrictModel):
    status: Literal["needs_confirmation"] = "needs_confirmation"
    provider: Literal["opencv-only", "yolo"]
    width: int
    height: int
    dominant_color: str
    detections: list[Detection]
    warnings: list[str]
