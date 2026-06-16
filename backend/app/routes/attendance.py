from fastapi import APIRouter, HTTPException, Request, Depends

from app.schemas.attendance import (
    FacultyAttendanceSubmission,
    StudentAttendanceSubmission,
)
from app.services.attendance_service import AttendanceService
from app.core.auth import get_current_user

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/students")
async def submit_student_attendance(
    payload: StudentAttendanceSubmission,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    payload.marked_by = current_user.get("id")
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
    current_user: dict = Depends(get_current_user),
):
    payload.marked_by = current_user.get("id")
    service = AttendanceService(request.app.state.supabase_admin)

    try:
        return service.save_faculty_attendance(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Faculty attendance save failed",
        ) from exc


@router.get("/faculty")
async def list_faculty_attendance(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    service = AttendanceService(request.app.state.supabase_admin)
    try:
        return service.list_faculty_attendance()
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Faculty attendance list failed",
        ) from exc

