from datetime import datetime, timezone
from itertools import product
from typing import Protocol
from uuid import uuid4
from ..schemas import Garment, Outfit, Recommendation, RecommendationRequest

OCCASION_TAGS = {
    "daily": {"日常", "通勤", "休闲", "百搭"},
    "interview": {"商务", "正式", "简约"},
    "business": {"商务", "正式"},
    "date": {"甜美", "优雅"},
    "sports": {"运动", "舒适"},
    "party": {"时尚", "聚会"},
}


class RecommendationProvider(Protocol):
    """Future provider must enforce network timeout before returning structured data."""
    def recommend(self, request: RecommendationRequest, garments: list[Garment]) -> list[dict]: ...


def valid_outfit(outfit: Outfit, available: dict[str, Garment]) -> bool:
    ids = outfit.garment_ids
    if len(ids) != len(set(ids)) or not set(ids).issubset(available):
        return False
    categories = [available[key].category for key in ids]
    if len(categories) != len(set(categories)):
        return False
    return "鞋子" in categories and (
        ("连衣裙" in categories and "上装" not in categories and "下装" not in categories)
        or ("上装" in categories and "下装" in categories and "连衣裙" not in categories)
    )


def recommend(request, garments, provider=None):
    available = {g.id: g for g in garments if g.status == "clean"}
    tags = OCCASION_TAGS[request.occasion] | set(request.preferences)

    def item_score(g):
        return len(set(g.tags) & tags)

    # Bound candidate count before the Cartesian product (<= 125 + 25 outfits).
    groups = {category: sorted(
        [g for g in available.values() if g.category == category],
        key=lambda g: (-item_score(g), g.id),
    )[:5] for category in ["上装", "下装", "鞋子", "连衣裙"]}
    combinations = list(product(groups["上装"], groups["下装"], groups["鞋子"]))
    combinations += list(product(groups["连衣裙"], groups["鞋子"]))
    outfits = []
    for combo in combinations:
        matches = sum(item_score(g) for g in combo)
        score = min(100, 60 + 10 * matches)
        outfits.append(Outfit(
            garment_ids=[g.id for g in combo], name=" + ".join(g.name for g in combo),
            score=score, reason=f"仅选取可穿衣物；匹配 {matches} 个场景/偏好标签。分数为规则分，不代表概率。",
        ))
    outfits.sort(key=lambda o: (-o.score, o.garment_ids))
    source, fallback = "rules", "llm_not_configured"
    if provider and available:
        try:
            candidate = [Outfit.model_validate(o) for o in provider.recommend(request, list(available.values()))]
            if not candidate or any(not valid_outfit(o, available) for o in candidate):
                raise ValueError("Invalid garment IDs or incomplete outfit")
            outfits, source, fallback = candidate, "llm", None
        except (TimeoutError, ConnectionError, ValueError):
            fallback = "llm_unavailable_or_invalid"
    return Recommendation(
        id=str(uuid4()), occasion=request.occasion, source=source, fallback_reason=fallback,
        outfits=outfits[:request.limit], created_at=datetime.now(timezone.utc),
        warnings=[] if outfits else ["可穿衣物不足：需要上装+下装+鞋子，或连衣裙+鞋子。"],
    )
