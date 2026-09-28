from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class LetterTemplate(Base):
    """The single college-approved visual template for approval letters."""

    __tablename__ = "letter_templates"

    id = Column(Integer, primary_key=True)
    college_name = Column(String(180), nullable=False, default="Govt. Model Engineering College, Kochi")
    college_logo_url = Column(String(1000), nullable=True)
    college_logo_public_id = Column(String(500), nullable=True)
    club_logo_url = Column(String(1000), nullable=True)
    club_logo_public_id = Column(String(500), nullable=True)
    signatory_name = Column(String(150), nullable=True)
    signatory_title = Column(String(150), nullable=True)
    signature_url = Column(String(1000), nullable=True)
    signature_public_id = Column(String(500), nullable=True)
    reference_prefix = Column(String(50), nullable=False, default="NEXUS")
    body_text = Column(Text, nullable=True)
    updated_at = Column(String, nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
