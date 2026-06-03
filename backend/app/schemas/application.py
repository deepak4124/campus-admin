from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


PHONE_PATTERN = r"^\+?[0-9][0-9\s().-]{6,19}$"
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
UUID_PATTERN = (
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


class StudentInput(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: Optional[str] = Field(default=None, max_length=80)
    dob: Optional[date] = None
    gender: Optional[str] = Field(default=None, max_length=30)
    mother_tongue: Optional[str] = Field(default=None, max_length=50)
    blood_group: Optional[str] = Field(default=None, max_length=5)
    allergy_food: Optional[str] = Field(default=None, max_length=500)
    class_id: Optional[str] = Field(default=None, pattern=UUID_PATTERN)
    parent_name: Optional[str] = Field(default=None, max_length=120)
    parent_phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN)
    parent_email: Optional[str] = Field(default=None, max_length=254, pattern=EMAIL_PATTERN)
    address: Optional[str] = Field(default=None, max_length=1000)
    admission_date: Optional[date] = None
    status: Optional[str] = Field(default="active", pattern=r"^(active|inactive)$")


class AdmissionInput(BaseModel):
    admission_date: Optional[date] = None
    admission_fee: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    joining_class: Optional[str] = Field(default=None, max_length=80)
    notes: Optional[str] = Field(default=None, max_length=1000)


class ParentInput(BaseModel):
    father_name: Optional[str] = Field(default=None, max_length=120)
    father_occupation: Optional[str] = Field(default=None, max_length=120)
    father_phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN)
    mother_name: Optional[str] = Field(default=None, max_length=120)
    mother_occupation: Optional[str] = Field(default=None, max_length=120)
    mother_phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN)


class EmergencyContactInput(BaseModel):
    priority: int = Field(ge=1, le=3)
    contact_name: str = Field(min_length=1, max_length=120)
    relation: Optional[str] = Field(default=None, max_length=80)
    phone: str = Field(pattern=PHONE_PATTERN)


class SiblingInput(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=120)
    dob: Optional[date] = None
    school_name: Optional[str] = Field(default=None, max_length=160)


class ReferenceInput(BaseModel):
    reference_details: Optional[str] = Field(default=None, max_length=500)
    reference_through: Optional[str] = Field(default=None, max_length=120)
    reference_phone: Optional[str] = Field(default=None, pattern=PHONE_PATTERN)


class ApplicationSubmission(BaseModel):
    student: StudentInput
    admission: Optional[AdmissionInput] = None
    parents: Optional[ParentInput] = None
    emergency_contacts: Optional[List[EmergencyContactInput]] = Field(default=None, max_length=3)
    siblings: Optional[List[SiblingInput]] = Field(default=None, max_length=10)
    references: Optional[List[ReferenceInput]] = Field(default=None, max_length=5)
