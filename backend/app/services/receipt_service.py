from datetime import datetime, timezone
from secrets import token_hex
from typing import Any, Dict

from app.schemas.receipt import ReceiptSubmission


class ReceiptService:
    def __init__(self, supabase_client):
        self.supabase = supabase_client

    def create_receipt(self, payload: ReceiptSubmission) -> Dict[str, Any]:
        receipt_number = self._generate_receipt_number()
        receipt_id = None

        receipt_data = {
            "receipt_number": receipt_number,
            "student_id": payload.student_id,
            "payment_date": payload.payment_date.isoformat(),
            "payment_method": payload.payment_method,
            "total_amount": payload.total_amount,
            "notes": payload.notes,
        }

        try:
            receipt_response = self.supabase.table("receipts").insert(receipt_data)
            receipt = self._first_row(receipt_response)
            receipt_id = receipt["receipt_id"]

            items = [
                {
                    "receipt_id": receipt_id,
                    "fee_type": item.fee_type,
                    "amount": item.amount,
                }
                for item in payload.items
            ]

            items_response = self.supabase.table("receipt_items").insert(items)
            if not items_response.data:
                raise RuntimeError("Supabase insert returned no receipt items")
        except Exception:
            if receipt_id:
                self._rollback_receipt(receipt_id)
            raise

        return {
            "receipt_id": receipt_id,
            "receipt_number": receipt_number,
            "status": "created",
        }

    @staticmethod
    def _generate_receipt_number() -> str:
        now = datetime.now(timezone.utc)
        return f"RCT-{now:%Y%m%d}-{token_hex(3)}"

    def _rollback_receipt(self, receipt_id: str) -> None:
        for table in ("receipt_items", "receipts"):
            try:
                self.supabase.table(table).eq("receipt_id", receipt_id).delete()
            except Exception:
                pass

    @staticmethod
    def _first_row(response) -> Dict[str, Any]:
        if not response.data:
            raise RuntimeError("Supabase insert returned no data")
        return response.data[0]
