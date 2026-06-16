from datetime import date
from typing import Optional
from pydantic import BaseModel, Field

UUID_PATTERN = (
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)

class FacultyCreate(BaseModel):
    employee_code: str = Field(min_length=2, max_length=20)
    first_name: str = Field(min_length=1, max_length=50)
    last_name: Optional[str] = Field(default=None, max_length=50)
    designation: Optional[str] = Field(default="Teacher", max_length=50)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=100)
    joining_date: Optional[date] = Field(default=None)
    status: Optional[str] = Field(default="active", pattern=r"^(active|inactive)$")

class FacultyUpdate(BaseModel):
    employee_code: Optional[str] = Field(default=None, min_length=2, max_length=20)
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(default=None, max_length=50)
    designation: Optional[str] = Field(default=None, max_length=50)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=100)
    joining_date: Optional[date] = Field(default=None)
    status: Optional[str] = Field(default=None, pattern=r"^(active|inactive)$")


class StudentUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(default=None, max_length=50)
    class_id: Optional[str] = Field(default=None, pattern=UUID_PATTERN)
    parent_name: Optional[str] = Field(default=None, max_length=100)
    parent_phone: Optional[str] = Field(default=None, max_length=20)
    parent_email: Optional[str] = Field(default=None, max_length=100)
    status: Optional[str] = Field(default=None, pattern=r"^(active|inactive)$")
    photo_url: Optional[str] = Field(default=None)

