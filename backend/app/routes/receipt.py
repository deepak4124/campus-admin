from fastapi import APIRouter, HTTPException, Request, Depends

from app.schemas.receipt import ReceiptSubmission
from app.services.receipt_service import ReceiptService
from app.core.auth import get_current_user

router = APIRouter(prefix="/receipts", tags=["receipts"])


@router.post("")
async def submit_receipt(
    payload: ReceiptSubmission,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    service = ReceiptService(request.app.state.supabase_admin)

    try:
        data = service.create_receipt(payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="Student not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Receipt submission failed") from exc

    return data

@router.get("/student/{student_id}")
async def list_receipts(
    student_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    service = ReceiptService(request.app.state.supabase_admin)
    try:
        return service.list_receipts(student_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Receipt list failed") from exc
