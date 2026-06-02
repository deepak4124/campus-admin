from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class StudentInput(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    mother_tongue: Optional[str] = None
    blood_group: Optional[str] = None
    allergy_food: Optional[str] = None
    class_id: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    address: Optional[str] = None
    admission_date: Optional[date] = None
    status: Optional[str] = "active"


class AdmissionInput(BaseModel):
    admission_date: Optional[date] = None
    admission_fee: Optional[float] = None
    joining_class: Optional[str] = None
    notes: Optional[str] = None


class ParentInput(BaseModel):
    father_name: Optional[str] = None
    father_occupation: Optional[str] = None
    father_phone: Optional[str] = None
    mother_name: Optional[str] = None
    mother_occupation: Optional[str] = None
    mother_phone: Optional[str] = None


class EmergencyContactInput(BaseModel):
    priority: int = Field(ge=1, le=3)
    contact_name: str
    relation: Optional[str] = None
    phone: str


class SiblingInput(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[date] = None
    school_name: Optional[str] = None


class ReferenceInput(BaseModel):
    reference_details: Optional[str] = None
    reference_through: Optional[str] = None
    reference_phone: Optional[str] = None


class ApplicationSubmission(BaseModel):
    student: StudentInput
    admission: Optional[AdmissionInput] = None
    parents: Optional[ParentInput] = None
    emergency_contacts: Optional[List[EmergencyContactInput]] = None
    siblings: Optional[List[SiblingInput]] = None
    references: Optional[List[ReferenceInput]] = None
