import uuid
from sqlalchemy import Column, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class MediaAsset(Base):
    __tablename__ = "media_assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_path = Column(Text, nullable=False)
    hash = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())

class ScannedContent(Base):
    __tablename__ = "scanned_content"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_path = Column(Text, nullable=False)
    hash = Column(Text, nullable=False)
    source = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    media_id = Column(UUID(as_uuid=True), ForeignKey("media_assets.id"))
    scanned_id = Column(UUID(as_uuid=True), ForeignKey("scanned_content.id"))
    similarity = Column(Float)
    status = Column(Text)
    detected_at = Column(DateTime, server_default=func.now())
