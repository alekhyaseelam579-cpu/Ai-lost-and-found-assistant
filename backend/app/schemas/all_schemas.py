from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    is_verified: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Item Schemas
class ItemCreate(BaseModel):
    type: str # 'lost' or 'found'
    name: str
    category: str
    description: str
    color: Optional[str] = None
    brand: Optional[str] = None
    location: str
    date_lost_found: str
    image_urls: List[str] = []
    additional_notes: Optional[str] = None

class ItemOut(BaseModel):
    id: str
    user_id: str
    type: str
    name: str
    category: str
    description: str
    color: Optional[str] = None
    brand: Optional[str] = None
    location: str
    date_lost_found: str
    image_urls: List[str]
    additional_notes: Optional[str] = None
    status: str
    qr_code_hash: Optional[str] = None
    created_at: datetime
    owner: Optional[UserOut] = None

    class Config:
        from_attributes = True

# Match Schemas
class MatchOut(BaseModel):
    id: str
    lost_item: ItemOut
    found_item: ItemOut
    text_sim: float
    image_sim: float
    category_match: float
    location_match: float
    brand_match: float
    color_match: float
    final_score: float
    ai_explanation: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Notification Schema
class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    match_id: Optional[str] = None
    item_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Activity Log Schema
class ActivityLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Analytics / Admin Dashboard Schema
class AdminAnalyticsOut(BaseModel):
    total_users: int
    total_items: int
    total_lost: int
    total_found: int
    total_matches: int
    approved_matches: int
    returned_items: int
    recovery_rate: float
    avg_recovery_days: float
    top_categories: List[dict]
    daily_reports: List[dict]
