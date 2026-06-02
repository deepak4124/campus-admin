from fastapi import APIRouter, HTTPException, Request

from app.schemas.receipt import ReceiptSubmission
from app.services.receipt_service import ReceiptService

router = APIRouter(prefix="/receipts", tags=["receipts"])


@router.post("")
async def submit_receipt(payload: ReceiptSubmission, request: Request):
    service = ReceiptService(request.app.state.supabase_admin)

    try:
        data = service.create_receipt(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Receipt submission failed") from exc

    return data
