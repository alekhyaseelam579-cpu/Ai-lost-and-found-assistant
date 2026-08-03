import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import User, Item, Match
from backend.app.schemas.all_schemas import ItemOut
from backend.app.auth.jwt_auth import get_current_user
from backend.app.ai.matching_engine import ai_engine
from backend.app.utils.qr_generator import generate_item_qr_code
from backend.app.utils.activity_logger import log_activity, send_match_notifications

router = APIRouter(prefix="/api/items", tags=["Items"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-images")
async def upload_images(files: List[UploadFile] = File(...)):
    """Uploads multiple images and returns web static URLs."""
    saved_urls = []
    for file in files:
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{uuid.uuid4().hex}.{file_ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
            
        saved_urls.append(f"/uploads/{filename}")
    return {"urls": saved_urls}

@router.post("", response_model=ItemOut)
def create_item(
    type: str = Form(...),
    name: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    color: Optional[str] = Form(None),
    brand: Optional[str] = Form(None),
    location: str = Form(...),
    date_lost_found: str = Form(...),
    additional_notes: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Process images
    image_urls = []
    first_image_path = None
    for file in images:
        if file.filename:
            file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
            filename = f"{uuid.uuid4().hex}.{file_ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(file.file.read())
            image_urls.append(f"/uploads/{filename}")
            if not first_image_path:
                first_image_path = filepath

    # Default fallback placeholder image if none provided
    if not image_urls:
        image_urls.append("https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=60")

    # Generate Embeddings using AI Matching Engine
    text_content = f"{name} {category} {description} {color or ''} {brand or ''} {location}"
    text_vector = ai_engine.generate_text_embedding(text_content)
    image_vector = ai_engine.generate_image_embedding(first_image_path) if first_image_path else None

    # Generate QR Code verification token
    temp_id = str(uuid.uuid4())
    qr_data_url = generate_item_qr_code(temp_id, name)

    item = Item(
        id=temp_id,
        user_id=current_user.id,
        type=type.lower(),
        name=name,
        category=category,
        description=description,
        color=color,
        brand=brand,
        location=location,
        date_lost_found=date_lost_found,
        image_urls=image_urls,
        additional_notes=additional_notes,
        status="active",
        qr_code_hash=qr_data_url,
        text_vector=text_vector,
        image_vector=image_vector
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    log_activity(db, current_user.id, f"REPORT_{type.upper()}", f"Reported {type} item: {name}")

    # Trigger Automatic AI Matching against complementary item type
    trigger_auto_ai_matching(db, item)

    return ItemOut.model_validate(item)

def trigger_auto_ai_matching(db: Session, new_item: Item):
    """Automatically scans database for candidate items and creates AI Match records if score > 50%."""
    opposite_type = "found" if new_item.type == "lost" else "lost"
    candidates = db.query(Item).filter(Item.type == opposite_type, Item.status == "active").all()

    for candidate in candidates:
        lost = new_item if new_item.type == "lost" else candidate
        found = candidate if new_item.type == "lost" else new_item

        score_dict = ai_engine.calculate_confidence_score(
            lost_item={"category": lost.category, "location": lost.location, "brand": lost.brand, "color": lost.color},
            found_item={"category": found.category, "location": found.location, "brand": found.brand, "color": found.color},
            lost_text_vec=lost.text_vector or [],
            found_text_vec=found.text_vector or [],
            lost_img_vec=lost.image_vector,
            found_img_vec=found.image_vector
        )

        final_score = score_dict["final_score"]
        if final_score >= 50.0:
            # Check if match already exists
            existing = db.query(Match).filter(
                Match.lost_item_id == lost.id,
                Match.found_item_id == found.id
            ).first()

            if not existing:
                match_rec = Match(
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
                db.add(match_rec)
                db.commit()
                db.refresh(match_rec)

                # High confidence alert (> 80%) dispatch notifications to lost item owner
                if final_score >= 80.0:
                    send_match_notifications(
                        db,
                        user_id=lost.user_id,
                        title=f"High Confidence AI Match ({final_score}%)!",
                        message=f"We found a matching item '{found.name}' for your lost '{lost.name}'.",
                        match_id=match_rec.id,
                        item_id=lost.id
                    )

@router.get("", response_model=dict)
def get_items(
    type: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Item)

    if type:
        query = query.filter(Item.type == type.lower())
    if category and category.lower() != "all":
        query = query.filter(Item.category.ilike(f"%{category}%"))
    if location:
        query = query.filter(Item.location.ilike(f"%{location}%"))
    if status:
        query = query.filter(Item.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Item.name.ilike(search_filter)) |
            (Item.description.ilike(search_filter)) |
            (Item.brand.ilike(search_filter)) |
            (Item.color.ilike(search_filter))
        )

    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [ItemOut.model_validate(it) for it in items]
    }

@router.get("/{item_id}", response_model=ItemOut)
def get_item_by_id(item_id: str, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return ItemOut.model_validate(item)
