# backend/models/notification.py
from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), default="info")  # info, warning, success, danger
    target = Column(String(20), default="all") # all, user, admin
    created_by = Column(String(50), default="Admin")
    created_at = Column(DateTime, default=datetime.utcnow)
