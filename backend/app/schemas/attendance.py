from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


UUID_PATTERN = (
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)
ATTENDANCE_STATUS_PATTERN = r"^(present|absent)$"


class StudentAttendanceRecordInput(BaseModel):
    student_id: str = Field(pattern=UUID_PATTERN)
    status: str = Field(pattern=ATTENDANCE_STATUS_PATTERN)
    remarks: Optional[str] = Field(default=None, max_length=500)


class StudentAttendanceSubmission(BaseModel):
    class_id: Optional[str] = Field(default=None, pattern=UUID_PATTERN)
    attendance_date: date
    marked_by: Optional[str] = Field(default="admin", max_length=120)
    records: List[StudentAttendanceRecordInput] = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def validate_unique_students(self):
        student_ids = [record.student_id for record in self.records]
        if len(student_ids) != len(set(student_ids)):
            raise ValueError("records cannot contain duplicate student_id values")
        return self


class FacultyAttendanceRecordInput(BaseModel):
    faculty_id: str = Field(pattern=UUID_PATTERN)
    status: str = Field(pattern=ATTENDANCE_STATUS_PATTERN)
    remarks: Optional[str] = Field(default=None, max_length=500)


class FacultyAttendanceSubmission(BaseModel):
    attendance_date: date
    marked_by: Optional[str] = Field(default="admin", max_length=120)
    records: List[FacultyAttendanceRecordInput] = Field(min_length=1, max_length=250)

    @model_validator(mode="after")
    def validate_unique_faculty(self):
        faculty_ids = [record.faculty_id for record in self.records]
        if len(faculty_ids) != len(set(faculty_ids)):
            raise ValueError("records cannot contain duplicate faculty_id values")
        return self
