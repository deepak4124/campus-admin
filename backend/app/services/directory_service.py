from typing import Any, Dict, List, Optional


class DirectoryService:
    STUDENT_SELECT = (
        "student_id,admission_no,first_name,last_name,class_id,parent_name,"
        "parent_phone,parent_email,status,photo_url"
    )
    CLASS_SELECT = "class_id,class_name,academic_year,class_teacher_id"
    FACULTY_SELECT = (
        "faculty_id,employee_code,first_name,last_name,designation,phone,email,status"
    )

    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def search_students(
        self,
        query: str,
        status: Optional[str] = "active",
        limit: int = 10,
    ) -> Dict[str, Any]:
        search_value = self._escape_search_value(query.strip())
        expression = ",".join(
            [
                f"admission_no.ilike.*{search_value}*",
                f"first_name.ilike.*{search_value}*",
                f"last_name.ilike.*{search_value}*",
                f"parent_name.ilike.*{search_value}*",
                f"parent_phone.ilike.*{search_value}*",
                f"parent_email.ilike.*{search_value}*",
            ]
        )

        table = (
            self.supabase.table("students")
            .select(self.STUDENT_SELECT)
            .or_(expression)
            .order("first_name")
            .limit(limit)
        )
        if status:
            table.eq("status", status)

        students = self._attach_class_names(table.execute().data or [])
        return {"results": students}

    def get_student(self, student_id: str) -> Dict[str, Any]:
        response = (
            self.supabase.table("students")
            .select(self.STUDENT_SELECT)
            .eq("student_id", student_id)
            .limit(1)
            .execute()
        )
        student = self._first_row(response.data)
        self._attach_class_names([student])
        return {"student": student}

    def list_students(
        self,
        status: Optional[str] = "active",
    ) -> Dict[str, Any]:
        table = (
            self.supabase.table("students")
            .select(self.STUDENT_SELECT)
            .order("first_name")
        )
        if status:
            table.eq("status", status)

        students = self._attach_class_names(table.execute().data or [])
        return {"students": students}

    def list_classes(self) -> Dict[str, Any]:
        response = (
            self.supabase.table("classes")
            .select(self.CLASS_SELECT)
            .order("class_name")
            .execute()
        )
        return {"classes": response.data or []}

    def list_students_by_class(
        self,
        class_id: str,
        status: Optional[str] = "active",
    ) -> Dict[str, Any]:
        table = (
            self.supabase.table("students")
            .select(self.STUDENT_SELECT)
            .eq("class_id", class_id)
            .order("first_name")
        )
        if status:
            table.eq("status", status)

        students = self._attach_class_names(table.execute().data or [])
        return {"class_id": class_id, "students": students}

    def list_faculty(
        self,
        status: Optional[str] = "active",
        limit: int = 100,
    ) -> Dict[str, Any]:
        table = (
            self.supabase.table("faculty")
            .select(self.FACULTY_SELECT)
            .order("first_name")
            .limit(limit)
        )
        if status:
            table.eq("status", status)

        return {"results": table.execute().data or []}

    def search_faculty(
        self,
        query: str,
        status: Optional[str] = "active",
        limit: int = 10,
    ) -> Dict[str, Any]:
        search_value = self._escape_search_value(query.strip())
        expression = ",".join(
            [
                f"employee_code.ilike.*{search_value}*",
                f"first_name.ilike.*{search_value}*",
                f"last_name.ilike.*{search_value}*",
                f"designation.ilike.*{search_value}*",
                f"phone.ilike.*{search_value}*",
                f"email.ilike.*{search_value}*",
            ]
        )

        table = (
            self.supabase.table("faculty")
            .select(self.FACULTY_SELECT)
            .or_(expression)
            .order("first_name")
            .limit(limit)
        )
        if status:
            table.eq("status", status)

        return {"results": table.execute().data or []}

    @staticmethod
    def _escape_search_value(value: str) -> str:
        return (
            value.replace("*", "")
            .replace(",", "")
            .replace("(", "")
            .replace(")", "")
        )

    @staticmethod
    def _first_row(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not rows:
            raise LookupError("Record not found")
        return rows[0]

    def _attach_class_names(
        self,
        students: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        class_ids = {student.get("class_id") for student in students}
        class_ids.discard(None)
        if not class_ids:
            return students

        classes = self.list_classes()["classes"]
        class_names = {
            row.get("class_id"): row.get("class_name")
            for row in classes
            if row.get("class_id")
        }

        for student in students:
            student["class_name"] = class_names.get(student.get("class_id"))

        return students

    def create_faculty(self, data: Dict[str, Any]) -> Dict[str, Any]:
        from datetime import date
        if isinstance(data.get("joining_date"), date):
            data["joining_date"] = data["joining_date"].isoformat()
        
        response = (
            self.supabase.table("faculty")
            .insert(data)
            .execute()
        )
        return self._first_row(response.data)

    def update_faculty(self, faculty_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        from datetime import date
        if isinstance(data.get("joining_date"), date):
            data["joining_date"] = data["joining_date"].isoformat()
        
        response = (
            self.supabase.table("faculty")
            .eq("faculty_id", faculty_id)
            .update(data)
        )
        return self._first_row(response.data)
    def delete_faculty(self, faculty_id: str) -> None:
        # Cascade-delete related attendance logs first
        self.supabase.table("faculty_attendance").eq("faculty_id", faculty_id).delete()
        
        response = (
            self.supabase.table("faculty")
            .eq("faculty_id", faculty_id)
            .delete()
        )
        if not response.data:
            raise LookupError("Faculty member not found")

    def update_student(self, student_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        response = (
            self.supabase.table("students")
            .eq("student_id", student_id)
            .update(data)
        )
        return self._first_row(response.data)
