import requests
import json

base_url = "http://localhost:8000"

def verify():
    # Login
    response = requests.post(f"{base_url}/api/v1/auth/login", json={
        "email": "admin@restaurant.com",
        "password": "Admin@123"
    })
    
    if response.status_code != 200:
        print("Login failed:", response.text)
        return
        
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Dashboard
    dash_resp = requests.get(f"{base_url}/api/v1/dashboard/", headers=headers)
    if dash_resp.status_code == 200:
        data = dash_resp.json()
        print("Quick Stats:")
        for stat in data.get("quick_stats", []):
            print(f"- {stat['label']}: {stat['value']}")
    else:
        print("Dashboard failed:", dash_resp.text)

if __name__ == "__main__":
    verify()
