from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import razorpay
import cloudinary
import cloudinary.uploader
from enum import Enum
from email_service import (
    send_order_confirmation_email, 
    send_order_status_update_email, 
    send_payment_success_email
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), os.environ.get('RAZORPAY_KEY_SECRET', '')))

# Cloudinary configuration
cloudinary_cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
cloudinary_api_key = os.environ.get('CLOUDINARY_API_KEY', '')
cloudinary_api_secret = os.environ.get('CLOUDINARY_API_SECRET', '')

if not cloudinary_cloud_name or not cloudinary_api_key or not cloudinary_api_secret:
    print("⚠️  WARNING: Cloudinary credentials missing! Image uploads will fail.")
    print(f"   CLOUDINARY_CLOUD_NAME: {'SET' if cloudinary_cloud_name else 'MISSING'}")
    print(f"   CLOUDINARY_API_KEY: {'SET' if cloudinary_api_key else 'MISSING'}")
    print(f"   CLOUDINARY_API_SECRET: {'SET' if cloudinary_api_secret else 'MISSING'}")
else:
    print(f"☁️ Cloudinary Configured: {cloudinary_cloud_name} (API Key: {cloudinary_api_key[:4]}***)")

cloudinary.config(
    cloud_name=cloudinary_cloud_name,
    api_key=cloudinary_api_key,
    api_secret=cloudinary_api_secret,
    secure=True
)

app = FastAPI()

# Thread pool for CPU-intensive work (bcrypt)
_bcrypt_executor = ThreadPoolExecutor(max_workers=4)

@app.on_event("startup")
async def create_indexes():
    """Create database indexes for fast lookups - eliminates full collection scans"""
    print("📇 Creating database indexes...")
    try:
        # Users - queried by email on every login, and by user_id on every auth check
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        # Sessions - queried by session_token on EVERY authenticated request
        await db.user_sessions.create_index("session_token", unique=True)
        await db.user_sessions.create_index("user_id")
        await db.user_sessions.create_index("expires_at")
        # Products
        await db.products.create_index("product_id", unique=True)
        await db.products.create_index("category")
        await db.products.create_index("featured")
        # Carts
        await db.carts.create_index("user_id", unique=True)
        # Orders
        await db.orders.create_index("order_id", unique=True)
        await db.orders.create_index("user_id")
        await db.orders.create_index([("user_id", 1), ("created_at", -1)])
        # Reviews
        await db.reviews.create_index("product_id")
        await db.reviews.create_index([("user_id", 1), ("product_id", 1)], unique=True)
        # Wishlists
        await db.wishlists.create_index("user_id", unique=True)
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Index creation warning (may already exist): {e}")

# CORS must be added BEFORE routes for preflight OPTIONS requests to work
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', 'https://etlawm.com,https://www.etlawm.com,https://etlawm-emergent.vercel.app,http://localhost:3000').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Enums
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

# ==================== AUTH MODELS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.USER
    created_at: datetime

class SessionData(BaseModel):
    user_id: str
    session_token: str

# ==================== PRODUCT MODELS ====================
class ProductVariant(BaseModel):
    variant_id: str = Field(default_factory=lambda: f"var_{uuid.uuid4().hex[:8]}")
    name: str  # e.g., "50ml", "100ml"
    price: float
    stock: int
    sku: str

    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('Price cannot be negative')
        return v

    @field_validator('stock')
    @classmethod
    def validate_stock(cls, v):
        if v < 0:
            raise ValueError('Stock cannot be negative')
        return v

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str = Field(default_factory=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    category: str
    base_price: float
    variants: List[ProductVariant] = []
    images: List[str] = []
    featured: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    category: str
    base_price: float
    variants: List[ProductVariant] = []
    images: List[str] = []
    featured: bool = False

    @field_validator('base_price')
    @classmethod
    def validate_base_price(cls, v):
        if v < 0:
            raise ValueError('Base price cannot be negative')
        return v

# ==================== CART MODELS ====================
class CartItem(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    quantity: int

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cart_id: str = Field(default_factory=lambda: f"cart_{uuid.uuid4().hex[:12]}")
    user_id: str
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== ORDER MODELS ====================
class OrderItem(BaseModel):
    product_id: str
    variant_id: Optional[str] = None
    product_name: str
    variant_name: Optional[str] = None
    price: float
    quantity: int

class ShippingAddress(BaseModel):
    name: str
    address: str
    city: str
    state: str
    pincode: str
    phone: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str = Field(default_factory=lambda: f"order_{uuid.uuid4().hex[:12]}")
    user_id: str
    items: List[OrderItem]
    total_amount: float
    shipping_address: ShippingAddress
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    status: OrderStatus = OrderStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[OrderItem]
    total_amount: float
    shipping_address: ShippingAddress

# ==================== PAYMENT VERIFICATION MODEL ====================
class PaymentVerification(BaseModel):
    payment_id: str
    razorpay_signature: str

# ==================== REVIEW MODELS ====================
class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str = Field(default_factory=lambda: f"rev_{uuid.uuid4().hex[:12]}")
    product_id: str
    user_id: str
    user_name: str
    rating: int  # 1-5
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

# ==================== WISHLIST MODELS ====================
class Wishlist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    wishlist_id: str = Field(default_factory=lambda: f"wish_{uuid.uuid4().hex[:12]}")
    user_id: str
    product_ids: List[str] = []

# ==================== AUTH HELPER ====================
async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    # Check cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token and credentials:
        session_token = credentials.credentials
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user)

async def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt())
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password.decode(),
        "role": UserRole.USER,
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Return user without password
    user_doc.pop("password")
    user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return User(**user_doc)

@api_router.post("/auth/login")
async def login(login_data: UserLogin, response: Response):
    # Find user
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password (run in thread pool to avoid blocking async event loop)
    password_valid = await asyncio.get_event_loop().run_in_executor(
        _bcrypt_executor,
        bcrypt.checkpw,
        login_data.password.encode(),
        user["password"].encode()
    )
    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Return user
    user.pop("password")
    user["created_at"] = datetime.fromisoformat(user["created_at"])
    return {"user": User(**user), "session_token": session_token}

class GoogleTokenData(BaseModel):
    access_token: str

@api_router.post("/auth/google/session")
async def google_auth_session(token_data: GoogleTokenData, response: Response):
    print(f"=== GOOGLE AUTH SESSION STARTED ===")
    
    if not token_data.access_token:
        print("❌ No access token provided")
        raise HTTPException(status_code=400, detail="Access token required")
    
    # Call Google Auth API using async httpx
    import httpx
    print(f"🔄 Calling Google UserInfo API...")
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data.access_token}"}
        )
    
    if auth_response.status_code != 200:
        print(f"❌ Invalid token from Google: {auth_response.text}")
        raise HTTPException(status_code=401, detail="Invalid Google token")
    
    data = auth_response.json()
    print(f"✅ Got user data from Google: {data.get('email')}")
    
    # Check if user exists
    user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if not user:
        # Create new user
        print(f"📝 Creating new user for {data['email']}")
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": data["email"],
            "name": data.get("name", "Google User"),
            "picture": data.get("picture"),
            "role": UserRole.USER,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        # A dummy password hash so DB structure is satisfied if needed
        import bcrypt
        user["password"] = bcrypt.hashpw(os.urandom(32), bcrypt.gensalt(4)).decode()
        await db.users.insert_one(user)
    else:
        print(f"✅ Found existing user: {user['user_id']}")
    
    # Store session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    print(f"💾 Storing session token...")
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    print(f"🍪 Setting cookie with session token")
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user.pop("password", None)
    
    # Ensure created_at is datetime object if the BaseModel validation is expected later
    if isinstance(user.get("created_at"), str):
        try:
            user["created_at"] = datetime.fromisoformat(user["created_at"])
        except ValueError:
            user["created_at"] = datetime.now(timezone.utc)
            
    print(f"✅ GOOGLE AUTH SESSION COMPLETED")
    return {"user": User(**user), "session_token": session_token}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, current_user: User = Depends(get_current_user)):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== PRODUCT ROUTES ====================
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, admin: User = Depends(get_admin_user)):
    product_obj = Product(**product.model_dump())
    doc = product_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    
    await db.products.insert_one(doc)
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    for p in products:
        if isinstance(p["created_at"], str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
    
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product["created_at"], str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductCreate, admin: User = Depends(get_admin_user)):
    result = await db.products.update_one(
        {"product_id": product_id},
        {"$set": product_update.model_dump()}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if isinstance(updated["created_at"], str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    
    return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: User = Depends(get_admin_user)):
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.get("/categories")
async def get_categories():
    categories = await db.products.distinct("category")
    return {"categories": categories}

# ==================== IMAGE UPLOAD ROUTES ====================
@api_router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), admin: User = Depends(get_admin_user)):
    """Upload an image to Cloudinary and return the URL"""
    # Check Cloudinary credentials are configured
    if not cloudinary_cloud_name or not cloudinary_api_key or not cloudinary_api_secret:
        logger.error("Cloudinary credentials not configured in .env")
        raise HTTPException(
            status_code=500, 
            detail="Image upload service not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file."
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Allowed: {', '.join(allowed_types)}")
    
    # Validate file size (max 10MB)
    contents = await file.read()
    file_size_mb = len(contents) / (1024 * 1024)
    logger.info(f"Received file: {file.filename}, type: {file.content_type}, size: {file_size_mb:.2f}MB")
    
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    
    try:
        # Upload to Cloudinary
        logger.info(f"Uploading {file.filename} to Cloudinary folder 'etlawm/products'...")
        result = cloudinary.uploader.upload(
            contents,
            folder="etlawm/products",
            resource_type="auto"
        )
        logger.info(f"Upload successful: {result.get('secure_url')}")
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height"),
            "server_version": "v1.3-debug-upload"
        }
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

@api_router.delete("/upload/image")
async def delete_image(public_id: str, admin: User = Depends(get_admin_user)):
    """Delete an image from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        return {"message": "Image deleted", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image deletion failed: {str(e)}")

# ==================== CART ROUTES ====================
@api_router.get("/cart", response_model=Cart)
async def get_cart(current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not cart:
        # Create empty cart
        cart_obj = Cart(user_id=current_user.user_id)
        doc = cart_obj.model_dump()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.carts.insert_one(doc)
        return cart_obj
    
    if isinstance(cart["updated_at"], str):
        cart["updated_at"] = datetime.fromisoformat(cart["updated_at"])
    
    return Cart(**cart)

@api_router.post("/cart/items")
async def add_to_cart(item: CartItem, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not cart:
        cart = Cart(user_id=current_user.user_id, items=[item])
        doc = cart.model_dump()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.carts.insert_one(doc)
    else:
        # Check if item exists
        items = cart.get("items", [])
        found = False
        for i, existing_item in enumerate(items):
            if existing_item["product_id"] == item.product_id and existing_item.get("variant_id") == item.variant_id:
                items[i]["quantity"] += item.quantity
                found = True
                break
        
        if not found:
            items.append(item.model_dump())
        
        await db.carts.update_one(
            {"user_id": current_user.user_id},
            {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"message": "Item added to cart"}

@api_router.put("/cart/items/{product_id}")
async def update_cart_item(product_id: str, quantity: int, variant_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    for i, item in enumerate(items):
        if item["product_id"] == product_id and item.get("variant_id") == variant_id:
            if quantity <= 0:
                items.pop(i)
            else:
                items[i]["quantity"] = quantity
            break
    
    await db.carts.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/items/{product_id}")
async def remove_from_cart(product_id: str, variant_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart.get("items", [])
    items = [item for item in items if not (item["product_id"] == product_id and item.get("variant_id") == variant_id)]
    
    await db.carts.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(current_user: User = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Cart cleared"}

# ==================== ORDER ROUTES ====================
@api_router.post("/orders/create")
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    # Validate stock before creating order
    for item in order_data.items:
        if item.variant_id:
            product = await db.products.find_one(
                {"product_id": item.product_id, "variants.variant_id": item.variant_id},
                {"_id": 0, "variants.$": 1, "name": 1}
            )
            if not product or not product.get("variants"):
                raise HTTPException(status_code=400, detail=f"Product variant not found: {item.product_id}/{item.variant_id}")
            variant = product["variants"][0]
            if variant["stock"] < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.get('name', item.product_id)} ({variant.get('name', item.variant_id)}): only {variant['stock']} available"
                )

    # Create Razorpay order
    try:
        razorpay_order = razorpay_client.order.create({
            "amount": int(order_data.total_amount * 100),  # Convert to paise
            "currency": "INR",
            "payment_capture": 1
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")
    
    # Create order in DB
    order = Order(
        user_id=current_user.user_id,
        items=order_data.items,
        total_amount=order_data.total_amount,
        shipping_address=order_data.shipping_address,
        razorpay_order_id=razorpay_order["id"]
    )
    
    doc = order.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.orders.insert_one(doc)
    
    # Send order confirmation email
    try:
        send_order_confirmation_email(
            to_email=current_user.email,
            order_data={
                "order_id": order.order_id,
                "items": [item.model_dump() for item in order.items],
                "total_amount": order.total_amount,
                "shipping_address": order.shipping_address.model_dump()
            }
        )
    except Exception as e:
        # Log error but don't fail the order
        print(f"Failed to send order confirmation email: {str(e)}")
    
    return {"order": order, "razorpay_order": razorpay_order}

@api_router.post("/orders/{order_id}/verify")
async def verify_payment(order_id: str, data: PaymentVerification, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": current_user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": data.payment_id,
            "razorpay_signature": data.razorpay_signature
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update order
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"payment_id": data.payment_id, "status": OrderStatus.CONFIRMED}}
    )
    
    # Update inventory
    for item in order["items"]:
        if item.get("variant_id"):
            await db.products.update_one(
                {"product_id": item["product_id"], "variants.variant_id": item["variant_id"]},
                {"$inc": {"variants.$.stock": -item["quantity"]}}
            )
    
    # Clear cart
    await db.carts.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send payment success email
    try:
        send_payment_success_email(
            to_email=current_user.email,
            order_data={
                "order_id": order["order_id"],
                "total_amount": order["total_amount"]
            },
            payment_id=data.payment_id
        )
    except Exception as e:
        print(f"Failed to send payment success email: {str(e)}")
    
    return {"message": "Payment verified", "order_id": order_id}

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for o in orders:
        if isinstance(o["created_at"], str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
    
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": current_user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order["created_at"], str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    
    return Order(**order)

# ==================== ADMIN ORDER ROUTES ====================
@api_router.get("/admin/orders")
async def get_all_orders(admin: User = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Populate user info for each order
    user_ids = list(set(o["user_id"] for o in orders))
    users = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "name": 1, "email": 1, "picture": 1}).to_list(1000)
    user_map = {u["user_id"]: u for u in users}
    
    enriched_orders = []
    for o in orders:
        if isinstance(o["created_at"], str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
        # Add user info
        user_info = user_map.get(o["user_id"], {})
        o["customer_name"] = user_info.get("name", "Unknown")
        o["customer_email"] = user_info.get("email", "Unknown")
        o["customer_picture"] = user_info.get("picture", None)
        enriched_orders.append(o)
    
    return enriched_orders

@api_router.get("/admin/orders/{order_id}")
async def get_admin_order_detail(order_id: str, admin: User = Depends(get_admin_user)):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order["created_at"], str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    
    # Populate user info
    user = await db.users.find_one({"user_id": order["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "email": 1, "picture": 1})
    if user:
        order["customer_name"] = user.get("name", "Unknown")
        order["customer_email"] = user.get("email", "Unknown")
        order["customer_picture"] = user.get("picture", None)
    
    return order

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: OrderStatus, admin: User = Depends(get_admin_user)):
    # Get order
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update status
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get user email
    user = await db.users.find_one({"user_id": order["user_id"]}, {"_id": 0})
    if user:
        # Send status update email
        try:
            send_order_status_update_email(
                to_email=user["email"],
                order_data={"order_id": order["order_id"]},
                new_status=status
            )
        except Exception as e:
            print(f"Failed to send status update email: {str(e)}")
    
    return {"message": "Order status updated"}

# ==================== REVIEW ROUTES ====================
@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: User = Depends(get_current_user)):
    # Check if user has ordered this product
    order = await db.orders.find_one({
        "user_id": current_user.user_id,
        "items.product_id": review_data.product_id,
        "status": {"$in": [OrderStatus.DELIVERED, OrderStatus.CONFIRMED]}
    })
    
    if not order:
        raise HTTPException(status_code=400, detail="You can only review products you've purchased")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({
        "user_id": current_user.user_id,
        "product_id": review_data.product_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")
    
    review = Review(
        product_id=review_data.product_id,
        user_id=current_user.user_id,
        user_name=current_user.name,
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    doc = review.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.reviews.insert_one(doc)
    
    return review

@api_router.get("/reviews/{product_id}", response_model=List[Review])
async def get_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for r in reviews:
        if isinstance(r["created_at"], str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
    
    return reviews

# ==================== WISHLIST ROUTES ====================
@api_router.get("/wishlist", response_model=Wishlist)
async def get_wishlist(current_user: User = Depends(get_current_user)):
    wishlist = await db.wishlists.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not wishlist:
        wishlist_obj = Wishlist(user_id=current_user.user_id)
        await db.wishlists.insert_one(wishlist_obj.model_dump())
        return wishlist_obj
    
    return Wishlist(**wishlist)

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, current_user: User = Depends(get_current_user)):
    await db.wishlists.update_one(
        {"user_id": current_user.user_id},
        {"$addToSet": {"product_ids": product_id}},
        upsert=True
    )
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, current_user: User = Depends(get_current_user)):
    await db.wishlists.update_one(
        {"user_id": current_user.user_id},
        {"$pull": {"product_ids": product_id}}
    )
    return {"message": "Removed from wishlist"}

# ==================== ADMIN CUSTOMER ROUTES ====================
@api_router.get("/admin/customers")
async def get_all_customers(admin: User = Depends(get_admin_user)):
    """Get all registered customers with order summary"""
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    
    # Get order counts and total spend per user
    pipeline = [
        {"$match": {"status": {"$in": [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED]}}},
        {"$group": {
            "_id": "$user_id",
            "total_orders": {"$sum": 1},
            "total_spent": {"$sum": "$total_amount"},
            "last_order_date": {"$max": "$created_at"}
        }}
    ]
    order_stats = await db.orders.aggregate(pipeline).to_list(1000)
    stats_map = {s["_id"]: s for s in order_stats}
    
    enriched_users = []
    for user in users:
        if isinstance(user.get("created_at"), str):
            try:
                user["created_at"] = datetime.fromisoformat(user["created_at"])
            except (ValueError, TypeError):
                user["created_at"] = datetime.now(timezone.utc)
        
        stats = stats_map.get(user["user_id"], {})
        user["total_orders"] = stats.get("total_orders", 0)
        user["total_spent"] = stats.get("total_spent", 0)
        user["last_order_date"] = stats.get("last_order_date", None)
        enriched_users.append(user)
    
    return enriched_users

@api_router.get("/admin/customers/{user_id}")
async def get_customer_detail(user_id: str, admin: User = Depends(get_admin_user)):
    """Get a specific customer's details and order history"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    if isinstance(user.get("created_at"), str):
        try:
            user["created_at"] = datetime.fromisoformat(user["created_at"])
        except (ValueError, TypeError):
            user["created_at"] = datetime.now(timezone.utc)
    
    # Get customer's orders
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for o in orders:
        if isinstance(o["created_at"], str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
    
    user["orders"] = orders
    
    # Get stats
    total_spent = sum(o["total_amount"] for o in orders if o["status"] in [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
    user["total_orders"] = len(orders)
    user["total_spent"] = total_spent
    
    return user

# ==================== STATS ROUTES ====================
@api_router.get("/admin/stats")
async def get_stats(admin: User = Depends(get_admin_user)):
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({})
    
    # Low stock products
    low_stock = await db.products.find(
        {"variants.stock": {"$lt": 10}},
        {"_id": 0, "product_id": 1, "name": 1, "variants": 1}
    ).to_list(100)
    
    # Revenue
    pipeline = [
        {"$match": {"status": {"$in": [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED]}}},
        {"$group": {"_id": None, "total_revenue": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
    
    return {
        "total_products": total_products,
        "total_orders": total_orders,
        "total_users": total_users,
        "total_revenue": total_revenue,
        "low_stock_products": low_stock
    }

# Include router
app.include_router(api_router)

# NOTE: CORS middleware is now added near the top of the file (after app = FastAPI())
# so that preflight OPTIONS requests for file uploads are handled correctly.

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
