import sys
import time
import requests
from urllib.parse import urlparse, parse_qs

GATEWAY_URL = "http://localhost:8000"
KEYCLOAK_TOKEN_URL = "http://localhost:8080/realms/sat-learning/protocol/openid-connect/token"
PARTNER_MOCK_URL = "http://localhost:3002"

def run_tests():
    print("==================================================")
    print("STARTING E2E VERIFICATION TEST FOR SAT LEARNING")
    print("==================================================")

    # 1. Verify 401 Unauthorized on Kong Gateway
    print("\n[Test 1] POST /api/v1/orders without Bearer Token...")
    payload = {
        "student_id": "STU-9988",
        "course_code": "SAT-MATH-PRO",
        "amount": 1500000
    }
    res = requests.post(f"{GATEWAY_URL}/api/v1/orders", json=payload)
    print(f"Response status: {res.status_code}")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("-> SUCCESS: Received 401 Unauthorized as expected.")

    # 2. Authenticate with Keycloak to request JWT Bearer Token
    print("\n[Test 2] Requesting JWT token from Keycloak...")
    token_data = {
        "client_id": "sat-platform",
        "username": "student1",
        "password": "password123",
        "grant_type": "password"
    }
    try:
        token_res = requests.post(KEYCLOAK_TOKEN_URL, data=token_data)
        token_res.raise_for_status()
        token_json = token_res.json()
        access_token = token_json["access_token"]
        print("-> SUCCESS: JWT token obtained successfully.")
    except Exception as e:
        print(f"-> FAILED: Could not contact Keycloak or obtain token: {e}")
        sys.exit(1)

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # 3. Create order with token
    print("\n[Test 3] Creating order through Kong Gateway...")
    order_res = requests.post(f"{GATEWAY_URL}/api/v1/orders", json=payload, headers=headers)
    print(f"Response status: {order_res.status_code}")
    order_res.raise_for_status()
    order_data = order_res.json()
    order_id = order_data["order_id"]
    payment_url = order_data["payment_url"]
    print(f"-> SUCCESS: Order created: {order_id}")
    print(f"   Redirection payment URL: {payment_url}")

    # 4. Check initial Order state is PENDING
    print("\n[Test 4] Verifying initial order status is PENDING...")
    detail_res = requests.get(f"{GATEWAY_URL}/api/v1/orders/{order_id}", headers=headers)
    detail_res.raise_for_status()
    order_detail = detail_res.json()
    print(f"   Order ID: {order_detail['order_id']}, Status: {order_detail['status']}")
    assert order_detail["status"] == "PENDING", f"Expected status PENDING, got {order_detail['status']}"
    print("-> SUCCESS: Initial order status is PENDING.")

    # 5. Extract transaction ID from checkout URL query param
    parsed_url = urlparse(payment_url)
    queries = parse_qs(parsed_url.query)
    txn_id = queries.get("txn_id", [None])[0]
    if not txn_id:
         txn_id = queries.get("order_id", [None])[0] # fallback if any
    
    print(f"\n[Test 5] Extracted transaction ID: {txn_id}")
    assert txn_id is not None, "Failed to extract transaction ID"

    # 6. Trigger webhook callback from partner mock
    print(f"\n[Test 6] Triggering Partner webhook callback for Transaction {txn_id}...")
    trigger_payload = {"transaction_id": txn_id}
    webhook_res = requests.post(f"{PARTNER_MOCK_URL}/partner/v1/trigger-webhook", json=trigger_payload)
    webhook_res.raise_for_status()
    print(f"   Partner response: {webhook_res.json()}")
    print("-> SUCCESS: Partner webhook triggered.")

    # 7. Wait briefly for RabbitMQ worker to consume event and update order state
    print("\n[Test 7] Waiting 2 seconds for RabbitMQ queue consumer to process payment completed event...")
    time.sleep(2)

    # 8. Verify order status has changed to PAID
    print("\n[Test 8] Checking final order status...")
    final_res = requests.get(f"{GATEWAY_URL}/api/v1/orders/{order_id}", headers=headers)
    final_res.raise_for_status()
    final_order = final_res.json()
    print(f"   Order ID: {final_order['order_id']}, Status: {final_order['status']}, Transaction ID: {final_order['transaction_id']}")
    assert final_order["status"] == "PAID", f"Expected final status PAID, got {final_order['status']}"
    print("-> SUCCESS: Order status updated to PAID via RabbitMQ.")

    print("\n==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
