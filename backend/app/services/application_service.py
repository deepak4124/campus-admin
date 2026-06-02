from datetime import datetime, timezone
from secrets import token_hex
from typing import Any, Dict, List, Optional

from app.schemas.application import ApplicationSubmission


class ApplicationService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def create_application(self, payload: ApplicationSubmission) -> Dict[str, Any]:
        student_data = payload.student.model_dump(exclude_none=True)
        student_data["admission_no"] = self._generate_admission_no()
        student_response = (
            self.supabase.table("students").insert(student_data)
        )
        student = self._first_row(student_response)
        student_id = student["student_id"]

        admission = None
        if payload.admission:
            admission_data = payload.admission.model_dump(exclude_none=True)
            admission_data["student_id"] = student_id
            admission_response = (
                self.supabase.table("admissions").insert(admission_data)
            )
            admission = self._first_row(admission_response)

        parents = None
        if payload.parents:
            parent_data = payload.parents.model_dump(exclude_none=True)
            parent_data["student_id"] = student_id
            parent_response = (
                self.supabase.table("student_parents").insert(parent_data)
            )
            parents = self._first_row(parent_response)

        emergency_contacts = self._insert_children(
            "student_emergency_contacts",
            student_id,
            payload.emergency_contacts,
        )
        siblings = self._insert_children(
            "student_siblings",
            student_id,
            payload.siblings,
        )
        references = self._insert_children(
            "student_references",
            student_id,
            payload.references,
        )

        return {
            "student": student,
            "admission": admission,
            "parents": parents,
            "emergency_contacts": emergency_contacts,
            "siblings": siblings,
            "references": references,
        }

    def _insert_children(
        self,
        table: str,
        student_id: str,
        items: Optional[List[Any]],
    ) -> List[Dict[str, Any]]:
        if not items:
            return []

        rows = []
        for item in items:
            row = item.model_dump(exclude_none=True)
            row["student_id"] = student_id
            rows.append(row)

        response = self.supabase.table(table).insert(rows)
        return response.data or []

    @staticmethod
    def _generate_admission_no() -> str:
        now = datetime.now(timezone.utc)
        return f"ADM-{now:%Y%m%d}-{token_hex(3).upper()}"

    @staticmethod
    def _first_row(response) -> Dict[str, Any]:
        if not response.data:
            raise RuntimeError("Supabase insert returned no data")
        return response.data[0]
