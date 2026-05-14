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
            "name": "ETLAWM DE - PIGMENTATION CREAM",
            "description": "Advanced Multi-active Brightening Formula with Tranexamic Acid 3% and Niacinamide 3%. Brightens dull skin, reduces pigmentation, boosts natural glow, and improves skin clarity and luminosity. Supports reduction in the appearance of discoloration and improves skin hydration and barrier comfort. Suitable for daily skincare routine with dermatologically inspired formulation. No Paraben, No Sulphate, No Cruelty. Suitable for all skin types.\n\nIngredients: Cetyl Alcohol, Glycerin, Tranexamic Acid, Niacinamide, Hyaluronic Acid, Ceramides Complex, Arbutin, Aluminium Starch Octenylsuccinate, Propylene Glycol, Glyceryl Stearate & PEG-100 Stearate, Steareth-21, Isopropyl Palmitate, Steareth-2, Glycolic Acid, Butyrospermum Parkii., Water (and) Glycerin & Rumex Occidentalis Extract, Isoamyl Laurate, Kojic Dipalmitate, Allantoin, Glycyrrhiza Glabra (Licorice) Root Extract, Phenoxyethanol & Ethylhexylglycerin, Pentaerythrityl Tetra-di-t-butyl Hydroxyyhydrocinnamate, Fragrance, Sodium Metabisulphite, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Butylated Hydroxy Toluene, Disodium EDTA, Sodium Hydroxide, Purified Water.\n\nDirection for use: Apply daily on clean face and gently massage until fully absorbed. Caution: Discontinue use if signs of irritation or rash appear. Avoid contact with eyes. Store protected from light and moisture at a temperature not exceeding 30°C.",
            "category": "Skincare",
            "base_price": 790.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "50ml", "price": 790.00, "stock": 50, "sku": "ETLAWM-DPC-50"}
            ],
            "images": [],
            "featured": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "product_id": f"prod_{uuid.uuid4().hex[:12]}",
            "name": "ETLAWM 15% Vitamin C Face Serum",
            "description": "ETLAWM High-Strength Face Serum with 15% Vitamin C complex is formulated to enhance skin brightness, clarity, and overall radiance. Enriched with niacinamide and hydrating actives, it supports smooth, luminous-looking skin with a lightweight, silky gel texture. Brightening • Antioxidant • Even Tone. Suitable for all skin types.\n\nIngredients: Aqua (Deionized Water), Glycerin, Propylene Glycol, Aristo flex AVC, 3-O-Ethyl Ascorbic Acid (Vitamin C), Niacinamide, Sodium Hyaluronate, Ferulic Acid, Tocopherol (Vitamin E), Allantoin, Triethanolamine, Disodium EDTA, DMDM Hydantoin.\n\nHow to use: Apply 2-3 drops to clean, dry face. Gently massage over face and neck until fully absorbed. Use twice daily for best results.\n\nStorage: Store in a cool, dry place away from direct sunlight. Caution: High-strength Vitamin C may cause slight tingling, especially on sensitive skin. If the problem persists for a longer time, discontinue use.",
            "category": "Skincare",
            "base_price": 656.00,
            "variants": [
                {"variant_id": f"var_{uuid.uuid4().hex[:8]}", "name": "30ml", "price": 656.00, "stock": 50, "sku": "ETLAWM-VCS-30"}
            ],
            "images": [],
            "featured": True,
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
