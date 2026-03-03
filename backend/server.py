from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import razorpay
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

app = FastAPI()
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
    
    # Check password
    if not bcrypt.checkpw(login_data.password.encode(), user["password"].encode()):
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

@api_router.post("/auth/google/session")
async def google_auth_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    import requests
    auth_response = requests.get(
        "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
        headers={"X-Session-ID": session_id}
    )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    data = auth_response.json()
    
    # Check if user exists
    user = await db.users.find_one({"email": data["email"]}, {"_id": 0})
    
    if not user:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": data["email"],
            "name": data["name"],
            "picture": data.get("picture"),
            "role": UserRole.USER,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    # Store session
    session_token = data["session_token"]
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
    
    user.pop("password", None)
    user["created_at"] = datetime.fromisoformat(user["created_at"])
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
async def verify_payment(order_id: str, payment_id: str, razorpay_signature: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"order_id": order_id, "user_id": current_user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": order["razorpay_order_id"],
            "razorpay_payment_id": payment_id,
            "razorpay_signature": razorpay_signature
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")
    
    # Update order
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"payment_id": payment_id, "status": OrderStatus.CONFIRMED}}
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
            payment_id=payment_id
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
@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(admin: User = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for o in orders:
        if isinstance(o["created_at"], str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
    
    return orders

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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
