from datetime import datetime, timezone
from secrets import token_hex
from typing import Any, Dict

from app.schemas.receipt import ReceiptSubmission


class ReceiptService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def create_receipt(self, payload: ReceiptSubmission) -> Dict[str, Any]:
        receipt_number = payload.receipt_number or self._generate_receipt_number()

        receipt_data = {
            "receipt_number": receipt_number,
            "student_id": payload.student_id,
            "payment_date": payload.payment_date.isoformat(),
            "payment_method": payload.payment_method,
            "total_amount": payload.total_amount,
            "notes": payload.notes,
        }

        receipt_response = (
            self.supabase.table("receipts").insert(receipt_data)
        )
        receipt = self._first_row(receipt_response)

        items = [
            {
                "receipt_id": receipt["receipt_id"],
                "fee_type": item.fee_type,
                "amount": item.amount,
            }
            for item in payload.items
        ]

        items_response = self.supabase.table("receipt_items").insert(items)

        return {
            "receipt": receipt,
            "items": items_response.data or [],
        }

    @staticmethod
    def _generate_receipt_number() -> str:
        now = datetime.now(timezone.utc)
        return f"RCT-{now:%Y%m%d}-{token_hex(3)}"

    @staticmethod
    def _first_row(response) -> Dict[str, Any]:
        if not response.data:
            raise RuntimeError("Supabase insert returned no data")
        return response.data[0]
