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

@router.post("/student/{student_id}/send-email")
async def send_fees_email(
    student_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    service = ReceiptService(request.app.state.supabase_admin)
    try:
        student = service._get_student_for_receipt(student_id)
        parent_email = student.get("parent_email")
        if not parent_email:
            raise HTTPException(status_code=400, detail="Missing parent email")
        
        # Get the latest receipt for this student to email
        receipts = service.list_receipts(student_id)
        amount = 0.0
        receipt_number = "N/A"
        if receipts:
            latest = receipts[0]
            amount = float(latest.get("total_amount", 0.0))
            receipt_number = latest.get("receipt_number", "N/A")
            
        student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}".strip() or "Student"
        
        from app.services.email_service import EmailService
        success = await EmailService.send_receipt_email(
            parent_email=parent_email,
            student_name=student_name,
            amount=amount,
            receipt_number=receipt_number
        )
        if not success:
            raise HTTPException(status_code=502, detail="Email dispatch failed")
            
        return {"status": "sent", "email": parent_email}
    except LookupError as exc:
        raise HTTPException(status_code=404, detail="Student not found") from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Email sending failed") from exc

