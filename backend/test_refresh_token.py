"""
Non-interactive test script for verifying authentication login and token refresh flow.
"""

import httpx
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Wrap httpx methods with default timeout of 30.0s
orig_post = httpx.post
orig_get = httpx.get
def post_with_timeout(*args, **kwargs):
    if 'timeout' not in kwargs:
        kwargs['timeout'] = 30.0
    return orig_post(*args, **kwargs)
def get_with_timeout(*args, **kwargs):
    if 'timeout' not in kwargs:
        kwargs['timeout'] = 30.0
    return orig_get(*args, **kwargs)
httpx.post = post_with_timeout
httpx.get = get_with_timeout

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_auth_refresh_flow():
    print("================ AUTH REFRESH VERIFICATION SUITE ================")
    
    # 1. Login with valid dev credentials
    login_payload = {"email": "admin@restaurant.com", "password": "Admin@123"}
    login_res = httpx.post(f"{BASE_URL}/auth/login", json=login_payload)
    assert login_res.status_code == 200, f"Login failed with status {login_res.status_code}: {login_res.text}"
    login_data = login_res.json()
    
    access_token = login_data.get("access_token")
    refresh_token = login_data.get("refresh_token")
    
    assert access_token, "login response missing access_token"
    assert refresh_token, "login response missing refresh_token"
    print(f"[PASS] 1. Login successful: Created access_token and refresh_token")
    print(f"        Access Token:  {access_token[:30]}...")
    print(f"        Refresh Token: {refresh_token[:30]}...")

    # 2. Call /auth/refresh with the login refresh_token
    refresh_payload = {"refresh_token": refresh_token}
    refresh_res = httpx.post(f"{BASE_URL}/auth/refresh", json=refresh_payload)
    assert refresh_res.status_code == 200, f"Refresh failed with status {refresh_res.status_code}: {refresh_res.text}"
    refresh_data = refresh_res.json()
    
    new_access_token = refresh_data.get("access_token")
    new_refresh_token = refresh_data.get("refresh_token")
    assert new_access_token, "refresh response missing access_token"
    print(f"[PASS] 2. /auth/refresh accepted token: Returned new access token")
    print(f"        New Access Token: {new_access_token[:30]}...")
    if new_refresh_token:
        print(f"        New Refresh Token: {new_refresh_token[:30]}...")

    # 3. Verify the newly refreshed access token works on protected endpoint (/auth/me)
    me_res = httpx.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {new_access_token}"})
    assert me_res.status_code == 200, f"Get /auth/me failed with status {me_res.status_code}: {me_res.text}"
    user_info = me_res.json()
    print(f"[PASS] 3. Refreshed access token validated at /auth/me for user: {user_info['email']} ({user_info['role']})")

    # 4. Call /auth/refresh with Bearer prefix format
    bearer_refresh_res = httpx.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": f"Bearer {refresh_token}"})
    assert bearer_refresh_res.status_code == 200, f"Bearer refresh failed: {bearer_refresh_res.text}"
    print(f"[PASS] 4. /auth/refresh accepted token with Bearer prefix")

    # 5. Call /auth/refresh with invalid refresh token -> Expect 401
    invalid_res = httpx.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": "invalid_token_string"})
    assert invalid_res.status_code == 401, f"Expected 401 for invalid token, got {invalid_res.status_code}"
    assert "Invalid or expired refresh token" in invalid_res.text, f"Unexpected error detail: {invalid_res.text}"
    print(f"[PASS] 5. Invalid refresh token correctly rejected with HTTP 401 'Invalid or expired refresh token'")

    print("\n================ ALL AUTH REFRESH TESTS PASSED ================")

if __name__ == "__main__":
    test_auth_refresh_flow()
