import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import asyncio

class EmailService:
    @staticmethod
    async def send_receipt_email(parent_email: str, student_name: str, amount: float, receipt_number: str):
        host = os.getenv("SMTP_HOST")
        port = int(os.getenv("SMTP_PORT", "587"))
        user = os.getenv("SMTP_USER")
        password = os.getenv("SMTP_PASSWORD")
        from_email = os.getenv("EMAIL_FROM")
        from_name = os.getenv("EMAIL_FROM_NAME", "Blooming Daffodils Playschool")

        if not all([host, user, password, from_email]):
            print("[EMAIL SERVICE] Skipping email send: SMTP environment variables are not fully configured.")
            return False

        # Build email message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Fee Payment Receipt - {receipt_number} - Blooming Daffodils"
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = parent_email

        # HTML Email Template
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #01434d; margin: 0; font-size: 24px;">Blooming Daffodils Playschool</h1>
              <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Receipt of Payment</p>
            </div>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <p style="margin-top: 0;">Dear Parent,</p>
              <p>Thank you for the payment for your child <strong>{student_name}</strong>.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #666;">Receipt Number</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #333;">{receipt_number}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #666;">Student Name</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #333;">{student_name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 16px; font-weight: bold;">Amount Paid</td>
                  <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: bold; color: #01434d;">₹{amount:,.2f}</td>
                </tr>
              </table>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center;">This is an automated receipt email. Please do not reply directly to this message.</p>
          </body>
        </html>
        """
        msg.attach(MIMEText(html_content, "html"))

        def _send():
            try:
                with smtplib.SMTP(host, port) as server:
                    server.starttls()
                    server.login(user, password)
                    server.sendmail(from_email, parent_email, msg.as_string())
                print(f"[EMAIL SERVICE] Email successfully sent via SMTP to {parent_email}")
                return True
            except Exception as e:
                print(f"[EMAIL SERVICE ERROR] Failed to send email to {parent_email} via SMTP: {e}")
                return False

        # Run smtplib code in background thread pool to keep endpoints fast
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _send)
