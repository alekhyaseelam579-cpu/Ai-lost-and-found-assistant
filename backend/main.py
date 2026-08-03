import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.database.session import engine, Base, SessionLocal
from backend.app.models.all_models import User, Item, Match, Notification, ActivityLog
from backend.app.auth.jwt_auth import get_password_hash
from backend.app.api import auth_routes, item_routes, match_routes, notification_routes, admin_routes
from backend.app.ai.matching_engine import ai_engine
from backend.app.utils.qr_generator import generate_item_qr_code

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Lost & Found Assistant API",
    description="Multimodal AI-powered platform for reporting, searching, matching lost and found items.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uploads directory static serving
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register Routers
app.include_router(auth_routes.router)
app.include_router(item_routes.router)
app.include_router(match_routes.router)
app.include_router(notification_routes.router)
app.include_router(admin_routes.router)

@app.on_event("startup")
def seed_initial_data():
    db = SessionLocal()
    try:
        # Check if admin user exists, create demo seed data if empty
        admin = db.query(User).filter(User.email == "admin@lostandfound.ai").first()
        if not admin:
            admin = User(
                email="admin@lostandfound.ai",
                full_name="Office Admin",
                role="admin",
                hashed_password=get_password_hash("admin123"),
                is_verified=True,
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
            )
            db.add(admin)

            student = User(
                email="student@university.edu",
                full_name="Alex Johnson",
                role="user",
                hashed_password=get_password_hash("student123"),
                is_verified=True,
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
            )
            db.add(student)
            db.commit()

            # Seed Demo Items
            item1 = Item(
                user_id=student.id,
                type="lost",
                name="Sony WH-1000XM4 Noise Canceling Headphones",
                category="Electronics",
                description="Matte black wireless headphones lost near campus library study hall. Left in black hardshell case.",
                color="Black",
                brand="Sony",
                location="Main Campus Library 2nd Floor",
                date_lost_found="2026-08-01",
                image_urls=["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=60"],
                additional_notes="Has a small sticker of a rocket on the right ear cup.",
                status="active"
            )
            item1.text_vector = ai_engine.generate_text_embedding(f"{item1.name} {item1.category} {item1.description}")
            item1.qr_code_hash = generate_item_qr_code(item1.id, item1.name)
            db.add(item1)

            item2 = Item(
                user_id=admin.id,
                type="found",
                name="Black Sony Wireless Headphones in Case",
                category="Electronics",
                description="Found black Sony headphones inside a zip case at library reception counter desk.",
                color="Black",
                brand="Sony",
                location="Main Campus Library Reception",
                date_lost_found="2026-08-02",
                image_urls=["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=60"],
                additional_notes="Turned in by janitorial staff.",
                status="active"
            )
            item2.text_vector = ai_engine.generate_text_embedding(f"{item2.name} {item2.category} {item2.description}")
            item2.qr_code_hash = generate_item_qr_code(item2.id, item2.name)
            db.add(item2)

            db.commit()

            # Trigger initial match score
            score_dict = ai_engine.calculate_confidence_score(
                lost_item={"category": item1.category, "location": item1.location, "brand": item1.brand, "color": item1.color},
                found_item={"category": item2.category, "location": item2.location, "brand": item2.brand, "color": item2.color},
                lost_text_vec=item1.text_vector,
                found_text_vec=item2.text_vector,
                lost_img_vec=None,
                found_img_vec=None
            )

            match_rec = Match(
                lost_item_id=item1.id,
                found_item_id=item2.id,
                text_sim=score_dict["text_sim"],
                image_sim=score_dict["image_sim"],
                category_match=score_dict["category_match"],
                location_match=score_dict["location_match"],
                brand_match=score_dict["brand_match"],
                color_match=score_dict["color_match"],
                final_score=score_dict["final_score"],
                ai_explanation=score_dict["ai_explanation"],
                status="pending"
            )
            db.add(match_rec)

            notif = Notification(
                user_id=student.id,
                title=f"AI Match Alert ({score_dict['final_score']}%)",
                message=f"Possible match found for your lost '{item1.name}' at Library Reception!",
                match_id=match_rec.id,
                item_id=item1.id
            )
            db.add(notif)

            activity = ActivityLog(
                user_id=admin.id,
                action="SYSTEM_INIT",
                details="Seeded initial demo dataset and AI matching model."
            )
            db.add(activity)

            db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "AI Lost & Found Assistant",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
