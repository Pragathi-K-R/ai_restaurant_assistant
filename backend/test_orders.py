import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_order_creation():
    # Get a token
    login_data = {"email": "admin@restaurant.com", "password": "Admin@123"}
    resp = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if resp.status_code != 200:
        print(f"Login failed: {resp.status_code}")
        return
    token = resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    order_types = ["DINE_IN", "TAKEAWAY", "DELIVERY"]
    table_numbers = ["12", None, None]
    
    for i, o_type in enumerate(order_types):
        # Frontend payload simulator (with the new fix, frontend sends lower case, but we also test backend tolerance by sending uppercase if we want, wait no, frontend sends normalized)
        # Let's test what frontend sends:
        normalized = o_type.lower()
        if normalized == 'dine-in': normalized = 'dine_in'
        
        payload = {
            "order_type": normalized,
            "table_number": table_numbers[i],
            "discount_amount": 0.0,
            "notes": f"Test {o_type}",
            "items": [{"menu_item_id": 1, "quantity": 2}]
        }
        
        print(f"\n--- Testing {o_type} ---")
        print(f"Payload: {json.dumps(payload)}")
        r = requests.post(f"{BASE_URL}/orders/", headers=headers, json=payload)
        print(f"Status: {r.status_code}")
        
        if r.status_code == 200:
            order = r.json()
            print(f"Order created! ID: {order['id']}, Type: {order['order_type']}, Total: {order['total_amount']}")
        else:
            print(f"Error: {r.text}")

if __name__ == "__main__":
    test_order_creation()
