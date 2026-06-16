from typing import Any, Dict, List, Optional

from app.schemas.application import ApplicationSubmission


class ApplicationService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def create_application(self, payload: ApplicationSubmission) -> Dict[str, Any]:
        student_id = None
        student_data = payload.student.model_dump(exclude_none=True)

        first_name = student_data.get("first_name")
        last_name = student_data.get("last_name")
        dob = student_data.get("dob")
        parent_email = student_data.get("parent_email")
        parent_phone = student_data.get("parent_phone")

        if first_name:
            response = (
                self.supabase.table("students")
                .select("student_id,first_name,last_name,dob,parent_email,parent_phone")
                .ilike("first_name", first_name.strip())
                .execute()
            )
            existing_students = response.data or []
            for s in existing_students:
                if not s.get("first_name") or s["first_name"].strip().lower() != first_name.strip().lower():
                    continue

                s_last = (s.get("last_name") or "").strip().lower()
                payload_last = (last_name or "").strip().lower()
                if s_last != payload_last:
                    continue

                dob_match = False
                if dob and s.get("dob"):
                    if str(dob) == str(s["dob"]):
                        dob_match = True

                email_match = False
                if parent_email and s.get("parent_email"):
                    if parent_email.strip().lower() == s["parent_email"].strip().lower():
                        email_match = True

                phone_match = False
                if parent_phone and s.get("parent_phone"):
                    if parent_phone.strip() == s["parent_phone"].strip():
                        phone_match = True

                if dob_match or email_match or phone_match:
                    raise ValueError(
                        "Duplicate submission detected. A student with the same name and "
                        "Date of Birth / Parent Contact details is already registered."
                    )

        try:
            student_response = self.supabase.table("students").insert(student_data)
            student = self._first_row(student_response)
            student_id = student["student_id"]
            if payload.admission:
                admission_data = payload.admission.model_dump(exclude_none=True)
                admission_data["student_id"] = student_id
                admission_response = (
                    self.supabase.table("admissions").insert(admission_data)
                )
                self._first_row(admission_response)

            if payload.parents:
                parent_data = payload.parents.model_dump(exclude_none=True)
                parent_data["student_id"] = student_id
                parent_response = (
                    self.supabase.table("student_parents").insert(parent_data)
                )
                self._first_row(parent_response)

            self._insert_children(
                "student_emergency_contacts",
                student_id,
                payload.emergency_contacts,
            )
            self._insert_children(
                "student_siblings",
                student_id,
                payload.siblings,
            )
            self._insert_children(
                "student_references",
                student_id,
                payload.references,
            )
        except Exception:
            if student_id:
                self._rollback_student_application(student_id)
            raise

        return {
            "application_id": student_id,
            "admission_no": student["admission_no"],
            "status": "submitted",
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

    def _rollback_student_application(self, student_id: str) -> None:
        for table in (
            "student_references",
            "student_siblings",
            "student_emergency_contacts",
            "student_parents",
            "admissions",
            "students",
        ):
            try:
                self.supabase.table(table).eq("student_id", student_id).delete()
            except Exception:
                pass

    @staticmethod
    def _first_row(response) -> Dict[str, Any]:
        if not response.data:
            raise RuntimeError("Supabase insert returned no data")
        return response.data[0]
