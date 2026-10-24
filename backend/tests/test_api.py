import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_auth_registration_and_login(client: AsyncClient):
    # 1. Register new customer
    reg_payload = {
        "name": "Arjun Sharma",
        "email": "arjun@example.com",
        "password": "MakerPassword@123",
        "phone": "+919988776655"
    }
    res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert res.status_code == 201
    data = res.json()
    assert data["role"] == "CUSTOMER"
    assert "access_token" in data

    # 2. Login
    login_payload = {
        "email": "arjun@example.com",
        "password": "MakerPassword@123"
    }
    res_login = await client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    assert res_login.json()["email"] == "arjun@example.com"

    # 3. Invalid credentials
    res_bad = await client.post("/api/v1/auth/login", json={
        "email": "arjun@example.com",
        "password": "WrongPassword"
    })
    assert res_bad.status_code == 401

@pytest.mark.asyncio
async def test_admin_role_authorization_check(client: AsyncClient, customer_token: str, owner_token: str):
    # Unauthenticated -> 401
    res_no_auth = await client.get("/api/v1/admin/dashboard")
    assert res_no_auth.status_code == 401

    # Customer user -> 403 Forbidden
    res_customer = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert res_customer.status_code == 403
    assert "Owner privileges required" in res_customer.json()["detail"]

    # Owner user -> 200 OK
    res_owner = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {owner_token}"}
    )
    assert res_owner.status_code == 200
    assert "total_orders" in res_owner.json()

@pytest.mark.asyncio
async def test_product_lifecycle_and_cart_and_order(client: AsyncClient, owner_token: str, customer_token: str):
    # 1. Owner creates a category
    cat_res = await client.post(
        "/api/v1/admin/categories",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "name": "Robotics Test Category",
            "description": "Category for testing",
            "is_active": True,
            "sort_order": 1
        }
    )
    assert cat_res.status_code == 201
    category = cat_res.json()

    # 2. Owner creates product
    prod_payload = {
        "category_id": category["id"],
        "name": "Test Microcontroller Board",
        "sku": "TEST-MCU-01",
        "brand": "DIY Tech",
        "short_description": "Board for test suite",
        "description": "Full description of test board.",
        "price": 100000,  # ₹1,000 in paise
        "sale_price": 80000,  # ₹800 in paise
        "stock_quantity": 20,
        "low_stock_threshold": 5,
        "is_published": True,
        "is_featured": True,
        "images": [{"image_url": "https://example.com/test.jpg", "alt_text": "Test", "sort_order": 0}],
        "specs": [{"spec_name": "Voltage", "spec_value": "5V"}]
    }
    prod_res = await client.post(
        "/api/v1/admin/products",
        headers={"Authorization": f"Bearer {owner_token}"},
        json=prod_payload
    )
    assert prod_res.status_code == 201
    product = prod_res.json()
    assert product["price"] == 100000
    assert product["sale_price"] == 80000

    # 3. Public lists products
    list_res = await client.get("/api/v1/products?search=TEST-MCU")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # 4. Public fetches product by slug
    slug_res = await client.get(f"/api/v1/products/{product['slug']}")
    assert slug_res.status_code == 200
    assert slug_res.json()["name"] == "Test Microcontroller Board"

    # 5. Customer creates quote
    quote_res = await client.post("/api/v1/checkout/quote", json={
        "items": [{"product_id": product["id"], "quantity": 2}],
        "pincode": "560001"
    })
    assert quote_res.status_code == 200
    q_data = quote_res.json()
    # 2 * 80000 = 160000 subtotal
    assert q_data["subtotal_paise"] == 160000
    # Over ₹999 -> shipping should be 0
    assert q_data["shipping_paise"] == 0
    # Tax: 18% of 160000 = 28800
    assert q_data["tax_paise"] == 28800
    # Total = 160000 + 0 + 28800 = 188800
    assert q_data["total_paise"] == 188800
    assert q_data["is_cod_eligible"] == True

    # 6. Place COD Order
    order_payload = {
        "items": [{"product_id": product["id"], "quantity": 2}],
        "shipping_address": {
            "recipient_name": "Arjun Sharma",
            "phone": "+919988776655",
            "address_line1": "Flat 101, Brigade Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560001"
        },
        "payment_method": "COD",
        "notes": "Please call before delivery"
    }
    order_res = await client.post(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {customer_token}"},
        json=order_payload
    )
    assert order_res.status_code == 201
    order_data = order_res.json()["order"]
    assert order_data["status"] == "PENDING"
    assert order_data["payment_method"] == "COD"
    assert order_data["payment_status"] == "PENDING"
    assert len(order_data["items"]) == 1

    # Verify inventory was decremented from 20 to 18
    prod_check = await client.get(f"/api/v1/products/{product['slug']}")
    assert prod_check.json()["stock_quantity"] == 18

    # 7. Customer cancels order -> verify inventory is returned back to 20!
    cancel_res = await client.post(
        f"/api/v1/orders/{order_data['id']}/cancel",
        headers={"Authorization": f"Bearer {customer_token}"},
        json={"reason": "Placed by mistake"}
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    prod_restocked = await client.get(f"/api/v1/products/{product['slug']}")
    assert prod_restocked.json()["stock_quantity"] == 20

@pytest.mark.asyncio
async def test_online_payment_verification(client: AsyncClient, customer_token: str):
    # Fetch existing seeded product
    res = await client.get("/api/v1/products?page_size=1")
    items = res.json()["items"]
    assert len(items) > 0
    product_id = items[0]["id"]

    # Place online order
    order_payload = {
        "items": [{"product_id": product_id, "quantity": 1}],
        "shipping_address": {
            "recipient_name": "Priya Patel",
            "phone": "+919876543212",
            "address_line1": "42 MG Road",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001"
        },
        "payment_method": "ONLINE"
    }
    order_res = await client.post(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {customer_token}"},
        json=order_payload
    )
    assert order_res.status_code == 201
    data = order_res.json()
    order = data["order"]
    gateway_data = data["gateway_data"]
    assert gateway_data is not None
    assert "id" in gateway_data

    # Verify payment with server verification endpoint
    verify_payload = {
        "order_id": order["id"],
        "gateway_order_id": gateway_data["id"],
        "gateway_payment_id": "pay_mock_123456789",
        "gateway_signature": "mock_signature_test"
    }
    verify_res = await client.post("/api/v1/payments/verify", json=verify_payload)
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["success"] == True
    assert v_data["payment_status"] == "PAID"
    assert v_data["order_status"] == "CONFIRMED"

    # Verify order is now CONFIRMED and PAID
    check_order = await client.get(
        f"/api/v1/orders/{order['order_number']}",
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    assert check_order.status_code == 200
    assert check_order.json()["payment_status"] == "PAID"
    assert check_order.json()["status"] == "CONFIRMED"

@pytest.mark.asyncio
async def test_owner_product_management_acceptance_test(client: AsyncClient, owner_user, customer_token: str):
    """
    Acceptance Test:
    1. Log in using the authorized owner account (karthik.suroju@gmail.com).
    2. Confirm role is OWNER and verify unauthorized customer cannot access product management endpoints.
    3. Add a new DIY technology product with specs, features, package contents, and pricing.
    4. Upload product image via multipart POST /api/v1/admin/products/{id}/images.
    5. Publish product and verify immediate reflection on public storefront & search.
    6. Edit price & stock via PATCH /api/v1/admin/products/{id} and verify immediate reflection.
    7. Toggle unpublish and verify hidden from public storefront.
    8. Toggle publish and verify visible again.
    9. Archive product via DELETE /api/v1/admin/products/{id} and verify exclusion.
    10. Verify unauthenticated users cannot access administrative product APIs.
    """
    # 1. Owner Login
    login_res = await client.post("/api/v1/auth/login", json={
        "email": "karthik.suroju@gmail.com",
        "password": "OwnerAdmin@2026!"
    })
    assert login_res.status_code == 200
    auth_data = login_res.json()
    assert auth_data["role"] == "OWNER"
    assert auth_data["email"] == "karthik.suroju@gmail.com"
    owner_token = auth_data["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    customer_headers = {"Authorization": f"Bearer {customer_token}"}

    # 2. Verify unauthorized customer cannot call admin product management endpoints
    forbidden_endpoints = [
        ("POST", "/api/v1/admin/products", {"name": "Unauthorized", "sku": "UNAUTH-1", "description": "test", "price": 100}),
        ("GET", "/api/v1/admin/products", None),
        ("PATCH", "/api/v1/admin/products/non-existent-id", {"price": 200}),
        ("DELETE", "/api/v1/admin/products/non-existent-id", None),
        ("PATCH", "/api/v1/admin/products/non-existent-id/publish", {"is_published": False}),
    ]
    for method, path, body in forbidden_endpoints:
        if method == "POST":
            res = await client.post(path, headers=customer_headers, json=body)
        elif method == "GET":
            res = await client.get(path, headers=customer_headers)
        elif method == "PATCH":
            res = await client.patch(path, headers=customer_headers, json=body)
        elif method == "DELETE":
            res = await client.delete(path, headers=customer_headers)
        assert res.status_code == 403, f"Expected 403 for customer on {method} {path}"

    # 3. Create a category for the product
    cat_res = await client.post(
        "/api/v1/admin/categories",
        headers=owner_headers,
        json={
            "name": "ESP32 & IoT Modules",
            "description": "Smart IoT development boards and connectivity components",
            "is_active": True,
            "sort_order": 2
        }
    )
    assert cat_res.status_code == 201
    category = cat_res.json()

    # 4. Add a new DIY technology product
    prod_payload = {
        "category_id": category["id"],
        "name": "VK Technology ESP32-S3 AI IoT Dev Board",
        "sku": "VK-ESP32-S3-AI-KIT",
        "brand": "VK Technology",
        "short_description": "Dual-Core ESP32-S3 with AI Acceleration & Camera support",
        "description": "High-performance IoT board featuring dual-core Xtensa 32-bit LX7 MCU, 8MB PSRAM, Wi-Fi 4 and Bluetooth 5 LE.",
        "features": "• Dual-core 240MHz Xtensa LX7\n• 8MB PSRAM + 16MB Flash\n• Camera sensor interface\n• Hardware AI acceleration",
        "price": 189900,  # ₹1,899 in paise
        "sale_price": 159900,  # ₹1,599 in paise
        "stock_quantity": 50,
        "low_stock_threshold": 5,
        "is_published": True,
        "is_featured": True,
        "weight_grams": 120,
        "package_dimensions": "12 x 8 x 2 cm",
        "package_contents": "1x ESP32-S3 Dev Board, 1x Type-C Cable, 1x Pinout Reference",
        "compatibility_info": "Arduino IDE, ESP-IDF, MicroPython",
        "warranty_info": "6 Months Manufacturing Warranty",
        "return_eligible": True,
        "specs": [
            {"spec_name": "Operating Voltage", "spec_value": "3.3V DC"},
            {"spec_name": "Clock Speed", "spec_value": "240 MHz"},
            {"spec_name": "Wireless", "spec_value": "Wi-Fi 802.11 b/g/n + BLE 5.0"}
        ]
    }
    create_res = await client.post("/api/v1/admin/products", headers=owner_headers, json=prod_payload)
    assert create_res.status_code == 201
    product = create_res.json()
    assert product["sku"] == "VK-ESP32-S3-AI-KIT"
    assert product["price"] == 189900
    assert product["sale_price"] == 159900
    assert product["features"] is not None
    assert "Xtensa LX7" in product["features"]
    assert product["is_published"] == True
    prod_id = product["id"]
    prod_slug = product["slug"]

    # 5. Upload product image via multipart POST /api/v1/admin/products/{id}/images
    dummy_image_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("esp32_board.png", dummy_image_content, "image/png")}
    upload_res = await client.post(
        f"/api/v1/admin/products/{prod_id}/images",
        headers=owner_headers,
        files=files
    )
    assert upload_res.status_code == 200
    prod_with_img = upload_res.json()
    assert len(prod_with_img["images"]) >= 1
    assert "/uploads/" in prod_with_img["images"][0]["image_url"]

    # 6. Public Storefront Verification
    # Search for product
    search_res = await client.get("/api/v1/products?search=VK-ESP32-S3")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total"] >= 1
    found = any(p["sku"] == "VK-ESP32-S3-AI-KIT" for p in search_data["items"])
    assert found, "Product should appear in public search results"

    # Category filter
    cat_filter_res = await client.get(f"/api/v1/products?category_slug={category['slug']}")
    assert cat_filter_res.status_code == 200
    assert any(p["sku"] == "VK-ESP32-S3-AI-KIT" for p in cat_filter_res.json()["items"])

    # Product details by slug
    details_res = await client.get(f"/api/v1/products/{prod_slug}")
    assert details_res.status_code == 200
    details = details_res.json()
    assert details["name"] == "VK Technology ESP32-S3 AI IoT Dev Board"
    assert details["price"] == 189900
    assert details["stock_quantity"] == 50
    assert "Xtensa LX7" in details["features"]
    assert len(details["images"]) >= 1

    # 7. Edit price and stock via PATCH /api/v1/admin/products/{id}
    update_res = await client.patch(
        f"/api/v1/admin/products/{prod_id}",
        headers=owner_headers,
        json={
            "price": 199900,  # Updated to ₹1,999
            "sale_price": 179900,  # Updated to ₹1,799
            "stock_quantity": 42
        }
    )
    assert update_res.status_code == 200
    updated_prod = update_res.json()
    assert updated_prod["price"] == 199900
    assert updated_prod["stock_quantity"] == 42

    # Verify public storefront immediately reflects price and stock change
    public_check = await client.get(f"/api/v1/products/{prod_slug}")
    assert public_check.status_code == 200
    assert public_check.json()["price"] == 199900
    assert public_check.json()["sale_price"] == 179900
    assert public_check.json()["stock_quantity"] == 42

    # 8. Unpublish product via PATCH /api/v1/admin/products/{id}/publish
    unpublish_res = await client.patch(
        f"/api/v1/admin/products/{prod_id}/publish",
        headers=owner_headers,
        json={"is_published": False}
    )
    assert unpublish_res.status_code == 200
    assert unpublish_res.json()["is_published"] == False

    # Confirm it is hidden from public storefront
    hidden_search = await client.get("/api/v1/products?search=VK-ESP32-S3")
    assert not any(p["sku"] == "VK-ESP32-S3-AI-KIT" for p in hidden_search.json()["items"])

    # 9. Re-publish product
    republish_res = await client.patch(
        f"/api/v1/admin/products/{prod_id}/publish",
        headers=owner_headers,
        json={"is_published": True}
    )
    assert republish_res.status_code == 200
    assert republish_res.json()["is_published"] == True

    visible_search = await client.get("/api/v1/products?search=VK-ESP32-S3")
    assert any(p["sku"] == "VK-ESP32-S3-AI-KIT" for p in visible_search.json()["items"])

    # 10. Archive product via DELETE /api/v1/admin/products/{id}
    archive_res = await client.delete(f"/api/v1/admin/products/{prod_id}", headers=owner_headers)
    assert archive_res.status_code == 200
    assert archive_res.json()["is_archived"] == True

    # Confirm archived product is excluded from public storefront
    archived_search = await client.get("/api/v1/products?search=VK-ESP32-S3")
    assert not any(p["sku"] == "VK-ESP32-S3-AI-KIT" for p in archived_search.json()["items"])

    # 11. Verify unauthenticated access is strictly rejected
    no_auth_res = await client.get("/api/v1/admin/products")
    assert no_auth_res.status_code == 401

