#!/usr/bin/env python3
"""Upload Vitamin C Serum images to Cloudinary and update the product in MongoDB."""
import os
import asyncio
import cloudinary
import cloudinary.uploader
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "etlawm")

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

SERUM_FOLDER = os.path.join(
    os.path.dirname(__file__), "..", "frontend", "public", "assets", "Vitamin C Face Serum"
)
PRODUCT_NAME = "ETLAWM 15% Vitamin C Face Serum"


def configure_cloudinary():
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
    )


def upload_images():
    image_urls = []
    files = sorted([
        f for f in os.listdir(SERUM_FOLDER)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")) and not f.startswith(".")
    ])

    print(f"Found {len(files)} images to upload...")
    for i, filename in enumerate(files, 1):
        filepath = os.path.join(SERUM_FOLDER, filename)
        public_id = f"products/vitamin-c-serum/vitaminc-serum-{i}"
        print(f"  Uploading {i}/{len(files)}: {filename} → {public_id}")
        result = cloudinary.uploader.upload(
            filepath,
            public_id=public_id,
            overwrite=True,
            resource_type="image",
        )
        image_urls.append(result["secure_url"])
        print(f"    ✅ {result['secure_url']}")

    return image_urls


async def update_product(image_urls):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    result = await db.products.update_one(
        {"name": PRODUCT_NAME},
        {"$set": {"images": image_urls}},
    )
    client.close()

    if result.matched_count == 0:
        print(f"\n❌ Product not found in DB: {PRODUCT_NAME}")
    else:
        print(f"\n✅ Updated '{PRODUCT_NAME}' with {len(image_urls)} images.")


async def main():
    configure_cloudinary()
    image_urls = upload_images()
    await update_product(image_urls)
    print("\n🎉 Done — serum is live with images!")


if __name__ == "__main__":
    asyncio.run(main())
