from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.all_models import User
from backend.app.schemas.all_schemas import UserRegister, UserLogin, Token, UserOut
from backend.app.auth.jwt_auth import verify_password, get_password_hash, create_access_token, get_current_user
from backend.app.utils.activity_logger import log_activity

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = get_password_hash(user_in.password)
    # Check if first user is admin
    is_first_user = db.query(User).count() == 0
    role = "admin" if is_first_user else "user"

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pw,
        role=role,
        is_verified=True,
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.email}"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_activity(db, user.id, "USER_REGISTER", f"Registered account {user.email}")
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user)
    }

@router.post("/login", response_model=Token)
def login_user(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    log_activity(db, user.id, "USER_LOGIN", f"Logged in from web client")

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserOut.model_validate(user)
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.post("/forgot-password")
def forgot_password(data: dict):
    email = data.get("email")
    return {"message": f"Password reset instructions have been dispatched to {email}."}
