from pydantic import BaseModel, Field
from typing import Optional


class LetterTemplateUpdate(BaseModel):
    college_name: Optional[str] = Field(default=None, min_length=2, max_length=180)
    signatory_name: Optional[str] = Field(default=None, max_length=150)
    signatory_title: Optional[str] = Field(default=None, max_length=150)
    reference_prefix: Optional[str] = Field(default=None, min_length=1, max_length=50)
    body_text: Optional[str] = Field(default=None, max_length=5000)
