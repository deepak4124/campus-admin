from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


UUID_PATTERN = (
    r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-"
    r"[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
)


class ReceiptItemInput(BaseModel):
    fee_type: str = Field(min_length=1, max_length=80)
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class ReceiptSubmission(BaseModel):
    student_id: str = Field(pattern=UUID_PATTERN)
    payment_date: datetime
    payment_method: str = Field(pattern=r"^(cash|upi|card|bank_transfer|cheque)$")
    total_amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    notes: Optional[str] = Field(default=None, max_length=1000)
    items: List[ReceiptItemInput] = Field(min_length=1, max_length=25)

    @model_validator(mode="after")
    def validate_total_amount(self):
        item_total = sum(item.amount for item in self.items)
        if item_total != self.total_amount:
            raise ValueError("total_amount must equal the sum of receipt item amounts")
        return self
