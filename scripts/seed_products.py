#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime, timezone
import uuid

async def seed_products():
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["test_database"]
    
    # Clear existing products
    await db.products.delete_many({})
    
    products = [
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "Luminous Serum",
            "description": "A lightweight, fast-absorbing serum that delivers intense hydration and radiance. Formulated with hyaluronic acid and vitamin C for glowing skin.",
            "category": "Skincare",
            "base_price": 2499.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "30ml", "price": 2499.00, "stock": 50, "sku": "LS-30"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "50ml", "price": 3999.00, "stock": 35, "sku": "LS-50"}
            ],
            "images": [
                "https://images.unsplash.com/photo-1620916566398-39f1143ab7be",
                "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908"
            ],
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "Velvet Matte Lipstick",
            "description": "Long-lasting matte lipstick with intense color payoff and comfortable wear. Available in classic shades.",
            "category": "Makeup",
            "base_price": 1299.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "Ruby Red", "price": 1299.00, "stock": 40, "sku": "VML-RR"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "Nude Rose", "price": 1299.00, "stock": 45, "sku": "VML-NR"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "Berry Wine", "price": 1299.00, "stock": 30, "sku": "VML-BW"}
            ],
            "images": [
                "https://images.unsplash.com/photo-1586495777744-4413f21062fa",
                "https://images.unsplash.com/photo-1631214524020-7e18db7f7c3c"
            ],
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "Radiance Face Cream",
            "description": "Rich moisturizing cream enriched with natural botanicals. Provides 24-hour hydration and improves skin texture.",
            "category": "Skincare",
            "base_price": 3499.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "50ml", "price": 3499.00, "stock": 25, "sku": "RFC-50"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "100ml", "price": 5999.00, "stock": 20, "sku": "RFC-100"}
            ],
            "images": [
                "https://images.unsplash.com/photo-1556228720-195a672e8a03",
                "https://images.unsplash.com/photo-1570554886111-e80fcca6a029"
            ],
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "Luxury Eye Palette",
            "description": "12-shade eyeshadow palette featuring highly pigmented mattes and shimmers. Create endless looks from day to night.",
            "category": "Makeup",
            "base_price": 2999.00,
            "variants": [],
            "images": [
                "https://images.unsplash.com/photo-1512496015851-a90fb38ba796",
                "https://images.unsplash.com/photo-1583241800698-516029e07dd7"
            ],
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "Hydrating Face Mask",
            "description": "Intensive hydrating mask with aloe vera and cucumber extract. Soothes and refreshes tired skin instantly.",
            "category": "Skincare",
            "base_price": 1799.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "Single", "price": 1799.00, "stock": 60, "sku": "HFM-1"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "Pack of 3", "price": 4999.00, "stock": 25, "sku": "HFM-3"}
            ],
            "images": [
                "https://images.unsplash.com/photo-1596755389378-c31d21fd1273",
                "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108"
            ],
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "Perfecting Foundation",
            "description": "Full coverage foundation with a natural finish. Buildable formula that lasts all day without feeling heavy.",
            "category": "Makeup",
            "base_price": 2299.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "Fair", "price": 2299.00, "stock": 30, "sku": "PF-F"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "Medium", "price": 2299.00, "stock": 35, "sku": "PF-M"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "Deep", "price": 2299.00, "stock": 28, "sku": "PF-D"}
            ],
            "images": [
                "https://images.unsplash.com/photo-1457972729786-0411a3b2b626",
                "https://images.unsplash.com/photo-1522338140262-f46f5913618a"
            ],
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "Nourishing Hair Oil",
            "description": "Lightweight hair oil infused with argan and jojoba oils. Adds shine and tames frizz without greasiness.",
            "category": "Haircare",
            "base_price": 1599.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "50ml", "price": 1599.00, "stock": 45, "sku": "NHO-50"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "100ml", "price": 2799.00, "stock": 30, "sku": "NHO-100"}
            ],
            "images": [
                "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d",
                "https://images.unsplash.com/photo-1629198726073-10f59c003f88"
            ],
            "featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "Luxury Body Lotion",
            "description": "Indulgent body lotion with shea butter and vitamin E. Deeply moisturizes and leaves skin silky smooth.",
            "category": "Body Care",
            "base_price": 1999.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "200ml", "price": 1999.00, "stock": 40, "sku": "LBL-200"},
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "400ml", "price": 3499.00, "stock": 25, "sku": "LBL-400"}
            ],
            "images": [
                "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b",
                "https://images.unsplash.com/photo-1556228720-195a672e8a03"
            ],
            "featured": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    result = await db.products.insert_many(products)
    print(f"✅ Inserted {len(result.inserted_ids)} products")
    
    # Create an admin user
    admin_exists = await db.users.find_one({"email": "admin@etlawm.com"})
    if not admin_exists:
        import bcrypt
        hashed_password = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt())
        admin_user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "admin@etlawm.com",
            "name": "Admin User",
            "password": hashed_password.decode(),
            "role": "admin",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        print("✅ Created admin user (email: admin@etlawm.com, password: admin123)")
    else:
        print("ℹ️  Admin user already exists")
    
    client.close()
    print("\n🎉 Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_products())
