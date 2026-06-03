from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request

from app.schemas.application import UUID_PATTERN
from app.services.directory_service import DirectoryService

router = APIRouter(tags=["directory"])


@router.get("/students/search")
async def search_students(
    request: Request,
    q: str = Query(min_length=1, max_length=120),
    status: Optional[str] = Query(default="active", pattern=r"^(active|inactive)$"),
    limit: int = Query(default=10, ge=1, le=50),
):
    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.search_students(query=q, status=status, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Student search failed") from exc


@router.get("/students/{student_id}")
async def get_student(student_id: str, request: Request):
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
async def list_classes(request: Request):
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
):
    service = DirectoryService(request.app.state.supabase_admin)

    try:
        return service.search_faculty(query=q, status=status, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Faculty search failed") from exc


def _matches_uuid(value: str) -> bool:
    import re

    return re.match(UUID_PATTERN, value) is not None
