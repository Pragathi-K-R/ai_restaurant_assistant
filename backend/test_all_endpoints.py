import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Wrap httpx methods with default timeout of 120.0s
orig_post = httpx.post
orig_get = httpx.get
def post_with_timeout(*args, **kwargs):
    if 'timeout' not in kwargs:
        kwargs['timeout'] = 120.0
    return orig_post(*args, **kwargs)
def get_with_timeout(*args, **kwargs):
    if 'timeout' not in kwargs:
        kwargs['timeout'] = 120.0
    return orig_get(*args, **kwargs)
httpx.post = post_with_timeout
httpx.get = get_with_timeout

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_tests():
    print("================ API VERIFICATION SUITE ================")
    
    # 1. Login
    login_res = httpx.post(f"{BASE_URL}/auth/login", json={"email": "admin@restaurant.com", "password": "Admin@123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    res_data = login_res.json()
    token = res_data.get("access_token") or res_data.get("data", {}).get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 1. Auth Login: HTTP 200 OK - Token acquired")


    # 2. Dashboard Metrics
    dash_res = httpx.get(f"{BASE_URL}/dashboard/", headers=headers)
    assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
    dash_data = dash_res.json()
    print(f"[PASS] 2. Dashboard Metrics: HTTP 200 OK - {len(dash_data['quick_stats'])} stats, {len(dash_data['ai_recommendations'])} recs")

    # 3. Menu Items
    menu_res = httpx.get(f"{BASE_URL}/menu/", headers=headers, follow_redirects=True)
    assert menu_res.status_code == 200, f"Menu failed: {menu_res.status_code} {menu_res.text}"
    menu_items = menu_res.json()["items"]
    print(f"[PASS] 3. Menu Items: HTTP 200 OK - {len(menu_items)} items retrieved")

    # 4. Create Order (POS)
    order_payload = {
        "notes": "E2E Test Order POS",
        "discount_amount": 0,
        "items": [
            {"menu_item_id": menu_items[0]["id"], "quantity": 2},
            {"menu_item_id": menu_items[1]["id"], "quantity": 1}
        ]
    }
    order_res = httpx.post(f"{BASE_URL}/orders/", json=order_payload, headers=headers, follow_redirects=True)
    assert order_res.status_code in [200, 201], f"Order creation failed: {order_res.status_code} {order_res.text}"
    new_order = order_res.json()
    print(f"[PASS] 4. Order Creation (POS): HTTP {order_res.status_code} - Created Order #{new_order['id']} Total: Rs.{new_order['total_amount']}")

    # 5. Get Orders List
    orders_res = httpx.get(f"{BASE_URL}/orders/", headers=headers, follow_redirects=True)
    assert orders_res.status_code == 200, f"Orders list failed: {orders_res.status_code} {orders_res.text}"
    orders_list = orders_res.json()["orders"]
    print(f"[PASS] 5. Orders History: HTTP 200 OK - {len(orders_list)} orders in database")

    # 6. Customers List
    cust_res = httpx.get(f"{BASE_URL}/customers/", headers=headers, follow_redirects=True)
    assert cust_res.status_code == 200, f"Customers failed: {cust_res.status_code} {cust_res.text}"
    customers = cust_res.json()["customers"]
    print(f"[PASS] 6. Customers: HTTP 200 OK - {len(customers)} customers retrieved")

    # 7. Reviews & Sentiment
    rev_res = httpx.get(f"{BASE_URL}/reviews/", headers=headers, follow_redirects=True)
    assert rev_res.status_code == 200, f"Reviews failed: {rev_res.status_code} {rev_res.text}"
    reviews = rev_res.json()["reviews"]
    print(f"[PASS] 7. Reviews: HTTP 200 OK - {len(reviews)} reviews retrieved")

    # 8. Food Waste
    waste_res = httpx.get(f"{BASE_URL}/waste/", headers=headers, follow_redirects=True)
    assert waste_res.status_code == 200, f"Waste failed: {waste_res.status_code} {waste_res.text}"
    waste_items = waste_res.json()["records"]
    print(f"[PASS] 8. Food Waste: HTTP 200 OK - {len(waste_items)} waste records retrieved")

    # 9. AI Status
    ai_status_res = httpx.get(f"{BASE_URL}/ai/status", headers=headers)
    assert ai_status_res.status_code == 200, f"AI status failed: {ai_status_res.text}"
    print(f"[PASS] 9. AI Status: HTTP 200 OK - {ai_status_res.json()}")

    # 10. AI Chat Endpoint
    ai_chat_res = httpx.post(
        f"{BASE_URL}/ai/chat",
        json={"question": "What are our best-selling menu items and food waste trends?"},
        headers=headers,
        timeout=60.0
    )
    assert ai_chat_res.status_code == 200, f"AI chat failed: {ai_chat_res.text}"
    ai_answer = ai_chat_res.json()["answer"]
    print(f"[PASS] 10. AI Chat Response: HTTP 200 OK\n---\n{ai_answer[:300]}...\n---")

    # 11. ML Demand Forecast
    df_res = httpx.get(f"{BASE_URL}/analytics/demand-forecast", headers=headers, timeout=30.0, follow_redirects=True)
    assert df_res.status_code == 200, f"Demand forecast failed: {df_res.status_code} {df_res.text}"
    print(f"[PASS] 11. ML Demand Forecast: HTTP 200 OK - {len(df_res.json().get('items', df_res.json().get('forecast', [])))} items forecasted")

    # 12. ML Customer Segments
    cs_res = httpx.get(f"{BASE_URL}/analytics/customer-segments", headers=headers, timeout=30.0, follow_redirects=True)
    assert cs_res.status_code == 200, f"Customer segments failed: {cs_res.status_code} {cs_res.text}"
    print(f"[PASS] 12. ML Customer Segments: HTTP 200 OK - {len(cs_res.json().get('segments', []))} segments")

    # 13. ML Anomalies
    anom_res = httpx.get(f"{BASE_URL}/analytics/anomalies", headers=headers, timeout=30.0, follow_redirects=True)
    assert anom_res.status_code == 200, f"Anomalies failed: {anom_res.status_code} {anom_res.text}"
    print(f"[PASS] 13. ML Anomalies: HTTP 200 OK - {anom_res.json().get('anomalies_count', 0)} anomalies detected")

    print("\n================ ALL 13 VERIFICATION TESTS PASSED ================")

if __name__ == "__main__":
    run_tests()
