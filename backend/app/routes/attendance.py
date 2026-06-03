from fastapi import APIRouter, HTTPException, Request

from app.schemas.attendance import (
    FacultyAttendanceSubmission,
    StudentAttendanceSubmission,
)
from app.services.attendance_service import AttendanceService

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/students")
async def submit_student_attendance(
    payload: StudentAttendanceSubmission,
    request: Request,
):
    service = AttendanceService(request.app.state.supabase_admin)

    try:
        return service.save_student_attendance(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Student attendance save failed",
        ) from exc


@router.post("/faculty")
async def submit_faculty_attendance(
    payload: FacultyAttendanceSubmission,
    request: Request,
):
    service = AttendanceService(request.app.state.supabase_admin)

    try:
        return service.save_faculty_attendance(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Faculty attendance save failed",
        ) from exc
