from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import User, Item, Match
from backend.app.schemas.all_schemas import MatchOut
from backend.app.auth.jwt_auth import get_current_user
from backend.app.ai.matching_engine import ai_engine
from backend.app.utils.activity_logger import log_activity, send_match_notifications

router = APIRouter(prefix="/api/matches", tags=["Matches"])

@router.get("", response_model=List[MatchOut])
def get_user_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all matches relevant to current user's reported lost/found items."""
    user_item_ids = [it.id for it in db.query(Item).filter(Item.user_id == current_user.id).all()]
    
    matches = db.query(Match).filter(
        (Match.lost_item_id.in_(user_item_ids)) | (Match.found_item_id.in_(user_item_ids))
    ).order_by(Match.final_score.desc()).all()

    return [MatchOut.model_validate(m) for m in matches]

@router.post("/run-search/{item_id}", response_model=List[MatchOut])
def run_ai_search_for_item(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_item = db.query(Item).filter(Item.id == item_id).first()
    if not target_item:
        raise HTTPException(status_code=404, detail="Item not found")

    opposite_type = "found" if target_item.type == "lost" else "lost"
    candidates = db.query(Item).filter(Item.type == opposite_type, Item.status == "active").all()

    results = []
    for candidate in candidates:
        lost = target_item if target_item.type == "lost" else candidate
        found = candidate if target_item.type == "lost" else target_item

        score_dict = ai_engine.calculate_confidence_score(
            lost_item={"category": lost.category, "location": lost.location, "brand": lost.brand, "color": lost.color},
            found_item={"category": found.category, "location": found.location, "brand": found.brand, "color": found.color},
            lost_text_vec=lost.text_vector or [],
            found_text_vec=found.text_vector or [],
            lost_img_vec=lost.image_vector,
            found_img_vec=found.image_vector
        )

        final_score = score_dict["final_score"]
        if final_score >= 40.0:
            existing = db.query(Match).filter(
                Match.lost_item_id == lost.id,
                Match.found_item_id == found.id
            ).first()

            if not existing:
                existing = Match(
                    lost_item_id=lost.id,
                    found_item_id=found.id,
                    text_sim=score_dict["text_sim"],
                    image_sim=score_dict["image_sim"],
                    category_match=score_dict["category_match"],
                    location_match=score_dict["location_match"],
                    brand_match=score_dict["brand_match"],
                    color_match=score_dict["color_match"],
                    final_score=final_score,
                    ai_explanation=score_dict["ai_explanation"],
                    status="pending"
                )
                db.add(existing)
                db.commit()
                db.refresh(existing)
            results.append(existing)

    return [MatchOut.model_validate(m) for m in results]

@router.put("/{match_id}/status")
def update_match_status(
    match_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_status = payload.get("status") # 'approved' or 'rejected'
    if new_status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    match_rec = db.query(Match).filter(Match.id == match_id).first()
    if not match_rec:
        raise HTTPException(status_code=404, detail="Match not found")

    match_rec.status = new_status
    if new_status == "approved":
        match_rec.lost_item.status = "matched"
        match_rec.found_item.status = "matched"
        send_match_notifications(
            db,
            user_id=match_rec.lost_item.user_id,
            title="Match Confirmed!",
            message=f"Your claim for '{match_rec.lost_item.name}' has been approved by staff.",
            match_id=match_rec.id
        )

    db.commit()
    log_activity(db, current_user.id, f"MATCH_{new_status.upper()}", f"Updated match {match_id} to {new_status}")
    return {"message": f"Match status updated to {new_status}"}
