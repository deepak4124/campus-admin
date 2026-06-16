from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request, Depends

from app.schemas.application import UUID_PATTERN
from app.schemas.directory import FacultyCreate, FacultyUpdate
from app.services.directory_service import DirectoryService
from app.core.auth import get_current_user

router = APIRouter(tags=["directory"])


@router.get("/students/search")
async def search_students(
    request: Request,
    q: str = Query(min_length=1, max_length=120),
    status: Optional[str] = Query(default="active", pattern=r"^(active|inactive)$"),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.search_students(query=q, status=status, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Student search failed") from exc


@router.get("/students")
async def list_students(
    request: Request,
    status: Optional[str] = Query(default="active", pattern=r"^(active|inactive)$"),
    current_user: dict = Depends(get_current_user),
):
    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.list_students(status=status)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Student list failed") from exc


@router.get("/students/{student_id}")
async def get_student(
    student_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    if not _matches_uuid(student_id):
        raise HTTPException(status_code=422, detail="Invalid student_id")

    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.get_student(student_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="Student not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Student lookup failed") from exc


@router.get("/classes")
async def list_classes(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.list_classes()
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Class list failed") from exc


@router.get("/classes/{class_id}/students")
async def list_students_by_class(
    class_id: str,
    request: Request,
    status: Optional[str] = Query(default="active", pattern=r"^(active|inactive)$"),
    current_user: dict = Depends(get_current_user),
):
    if not _matches_uuid(class_id):
        raise HTTPException(status_code=422, detail="Invalid class_id")

    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.list_students_by_class(class_id=class_id, status=status)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Class student list failed") from exc


@router.get("/faculty")
async def list_faculty(
    request: Request,
    status: Optional[str] = Query(default="active", pattern=r"^(active|inactive)$"),
    limit: int = Query(default=100, ge=1, le=250),
    current_user: dict = Depends(get_current_user),
):
    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.list_faculty(status=status, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Faculty list failed") from exc


@router.get("/faculty/search")
async def search_faculty(
    request: Request,
    q: str = Query(min_length=1, max_length=120),
    status: Optional[str] = Query(default="active", pattern=r"^(active|inactive)$"),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.search_faculty(query=q, status=status, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Faculty search failed") from exc


@router.post("/faculty")
async def create_faculty(
    payload: FacultyCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    service = DirectoryService(request.app.state.supabase_admin)
    try:
        return service.create_faculty(payload.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Faculty creation failed") from exc


@router.put("/faculty/{faculty_id}")
async def update_faculty(
    faculty_id: str,
    payload: FacultyUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    if not _matches_uuid(faculty_id):
        raise HTTPException(status_code=422, detail="Invalid faculty_id")
    
    service = DirectoryService(request.app.state.supabase_admin)
    try:
        return service.update_faculty(faculty_id, payload.model_dump(exclude_unset=True))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="Faculty not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Faculty update failed") from exc


@router.delete("/faculty/{faculty_id}")
async def delete_faculty(
    faculty_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    if not _matches_uuid(faculty_id):
        raise HTTPException(status_code=422, detail="Invalid faculty_id")
    
    service = DirectoryService(request.app.state.supabase_admin)
    try:
        service.delete_faculty(faculty_id)
        return {"success": True}
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="Faculty not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Faculty deletion failed") from exc


def _matches_uuid(value: str) -> bool:
    import re

    return re.match(UUID_PATTERN, value) is not None
