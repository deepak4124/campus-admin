from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ReceiptItemInput(BaseModel):
    fee_type: str
    amount: float


class ReceiptSubmission(BaseModel):
    student_id: str
    payment_date: datetime
    payment_method: str
    total_amount: float
    notes: Optional[str] = None
    receipt_number: Optional[str] = None
    items: List[ReceiptItemInput]
