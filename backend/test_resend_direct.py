import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import _send_resend_email

async def test():
    success = await _send_resend_email(
        "ashishiitb22@gmail.com",
        "✅ HireAI Premium SSL Bypass Test",
        "<h1>It works!</h1><p>The SSL block has been bypassed using HTTPX.</p>"
    )
    print(f"Final Success: {success}")

if __name__ == "__main__":
    asyncio.run(test())
