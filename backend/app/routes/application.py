import logging

from fastapi import APIRouter, HTTPException, Request

from app.schemas.application import ApplicationSubmission
from app.services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])
logger = logging.getLogger(__name__)


@router.post("")
async def submit_application(payload: ApplicationSubmission, request: Request):
    service = ApplicationService(request.app.state.supabase_admin)

    try:
        data = service.create_application(payload)
    except Exception as exc:
        logger.exception("Application submission failed")
        raise HTTPException(
            status_code=502,
            detail={
                "message": "Application submission failed",
                "error": str(exc),
            },
        ) from exc

    return data
