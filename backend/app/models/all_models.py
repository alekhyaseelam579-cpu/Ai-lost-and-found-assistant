import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user") # 'user' or 'admin'
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    items = relationship("Item", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")


class Item(Base):
    __tablename__ = "items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False, index=True) # 'lost' or 'found'
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    color = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    location = Column(String, nullable=False)
    date_lost_found = Column(String, nullable=False)
    image_urls = Column(JSON, default=list) # List of image URLs
    additional_notes = Column(Text, nullable=True)
    status = Column(String, default="active", index=True) # 'active', 'matched', 'returned', 'claimed'
    qr_code_hash = Column(String, nullable=True, unique=True)
    
    # Store JSON representation of embedding vector for persistence
    text_vector = Column(JSON, nullable=True)
    image_vector = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="items")
    lost_matches = relationship("Match", foreign_keys="[Match.lost_item_id]", back_populates="lost_item", cascade="all, delete-orphan")
    found_matches = relationship("Match", foreign_keys="[Match.found_item_id]", back_populates="found_item", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lost_item_id = Column(String, ForeignKey("items.id"), nullable=False)
    found_item_id = Column(String, ForeignKey("items.id"), nullable=False)
    
    text_sim = Column(Float, default=0.0)
    image_sim = Column(Float, default=0.0)
    category_match = Column(Float, default=0.0)
    location_match = Column(Float, default=0.0)
    brand_match = Column(Float, default=0.0)
    color_match = Column(Float, default=0.0)
    
    final_score = Column(Float, nullable=False) # Total confidence percentage (0 - 100)
    ai_explanation = Column(Text, nullable=True)
    status = Column(String, default="pending", index=True) # 'pending', 'approved', 'rejected'
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    lost_item = relationship("Item", foreign_keys=[lost_item_id], back_populates="lost_matches")
    found_item = relationship("Item", foreign_keys=[found_item_id], back_populates="found_matches")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    match_id = Column(String, ForeignKey("matches.id"), nullable=True)
    item_id = Column(String, ForeignKey("items.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False) # e.g. "REPORT_LOST", "REPORT_FOUND", "MATCH_FOUND", "ADMIN_APPROVE"
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="activities")
