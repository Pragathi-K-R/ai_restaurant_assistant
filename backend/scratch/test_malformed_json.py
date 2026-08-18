import httpx
import asyncio
from app.core.security import create_refresh_token
from app.core.config import settings

token = create_refresh_token(subject=1)
print(f"Generated token (length {len(token)}): {token}")

def test_json(payload, name):
    r = httpx.post('http://127.0.0.1:8000/api/v1/auth/refresh', content=payload, headers={'Content-Type': 'application/json'})
    print(f"--- Test: {name} (Payload len: {len(payload)}) ---")
    print("Status:", r.status_code)
    print("Response:", r.text)

# Case A: Missing closing quote at the end of the JSON object
# { "refresh_token": "TOKEN }
payload_a = f'{{\n  "refresh_token": "{token}\n}}'
test_json(payload_a, "Missing closing quote")

# Case B: Missing closing quote AND closing brace (truncated)
# { "refresh_token": "TOKEN
payload_b = f'{{\n  "refresh_token": "{token}'
test_json(payload_b, "Truncated (missing quote and brace)")

# Case C: Double quote inside token or invalid pasting
payload_c = f'{{\n  "refresh_token": "{token}"\n}}'
test_json(payload_c, "Correct JSON structure")
