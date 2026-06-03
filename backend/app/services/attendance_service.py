from datetime import datetime, timezone
from typing import Any, Dict, List

from app.schemas.attendance import (
    FacultyAttendanceSubmission,
    StudentAttendanceSubmission,
)


class AttendanceService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def save_student_attendance(
        self,
        payload: StudentAttendanceSubmission,
    ) -> Dict[str, Any]:
        marked_at = datetime.now(timezone.utc).isoformat()
        saved_rows = []
        created = 0
        updated = 0

        for record in payload.records:
            row = {
                "student_id": record.student_id,
                "attendance_date": payload.attendance_date.isoformat(),
                "status": record.status,
                "remarks": record.remarks,
                "marked_by": payload.marked_by,
                "marked_at": marked_at,
            }
            saved_row, was_created = self._save_attendance_row(
                table="student_attendance",
                id_column="student_id",
                id_value=record.student_id,
                attendance_date=payload.attendance_date.isoformat(),
                row=row,
            )
            saved_rows.append(saved_row)
            if was_created:
                created += 1
            else:
                updated += 1

        return {
            "status": "saved",
            "attendance_date": payload.attendance_date.isoformat(),
            "class_id": payload.class_id,
            "total": len(saved_rows),
            "created": created,
            "updated": updated,
            "records": self._summarize_student_rows(saved_rows),
        }

    def save_faculty_attendance(
        self,
        payload: FacultyAttendanceSubmission,
    ) -> Dict[str, Any]:
        marked_at = datetime.now(timezone.utc).isoformat()
        saved_rows = []
        created = 0
        updated = 0

        for record in payload.records:
            row = {
                "faculty_id": record.faculty_id,
                "attendance_date": payload.attendance_date.isoformat(),
                "status": record.status,
                "remarks": record.remarks,
                "marked_by": payload.marked_by,
                "marked_at": marked_at,
            }
            saved_row, was_created = self._save_attendance_row(
                table="faculty_attendance",
                id_column="faculty_id",
                id_value=record.faculty_id,
                attendance_date=payload.attendance_date.isoformat(),
                row=row,
            )
            saved_rows.append(saved_row)
            if was_created:
                created += 1
            else:
                updated += 1

        return {
            "status": "saved",
            "attendance_date": payload.attendance_date.isoformat(),
            "total": len(saved_rows),
            "created": created,
            "updated": updated,
            "records": self._summarize_faculty_rows(saved_rows),
        }

    def _save_attendance_row(
        self,
        table: str,
        id_column: str,
        id_value: str,
        attendance_date: str,
        row: Dict[str, Any],
    ):
        existing = (
            self.supabase.table(table)
            .select("attendance_id")
            .eq(id_column, id_value)
            .eq("attendance_date", attendance_date)
            .limit(1)
            .execute()
        )

        if existing.data:
            attendance_id = existing.data[0]["attendance_id"]
            response = (
                self.supabase.table(table)
                .eq("attendance_id", attendance_id)
                .update(row)
            )
            return self._first_row(response), False

        response = self.supabase.table(table).insert(row)
        return self._first_row(response), True

    @staticmethod
    def _summarize_student_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [
            {
                "attendance_id": row.get("attendance_id"),
                "student_id": row.get("student_id"),
                "status": row.get("status"),
            }
            for row in rows
        ]

    @staticmethod
    def _summarize_faculty_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return [
            {
                "attendance_id": row.get("attendance_id"),
                "faculty_id": row.get("faculty_id"),
                "status": row.get("status"),
            }
            for row in rows
        ]

    @staticmethod
    def _first_row(response) -> Dict[str, Any]:
        if not response.data:
            raise RuntimeError("Supabase write returned no data")
        return response.data[0]
