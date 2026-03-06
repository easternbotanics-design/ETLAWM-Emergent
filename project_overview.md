# ETLAWM-Emergent: Project & Tech Stack Overview

ETLAWM is a premium e-commerce platform featuring a luxury, monochrome aesthetic designed for high-end beauty or lifestyle products. The project includes a full-featured customer storefront, an admin dashboard for catalogue/inventory management, and a robust backend.

## 1. Project Features

### Core E-Commerce
*   **Product Catalogue**: Multi-variant product support (e.g., sizes like 50ml, 100ml) with individual pricing and SKU tracking.
*   **Cart & Checkout**: Complete shopping cart functionality with Razorpay integration for secure payment processing. 
*   **Order Management**: Full order lifecycle tracking (Pending -> Confirmed -> Shipped -> Delivered -> Cancelled).
*   **Customer Features**: Wishlists and a verified-buyer review system (only customers with delivered products can review them).
*   **Automated Emails**: Order confirmation, status updates, and payment success emails sent via a dedicated email service.

### Admin Capabilities
*   **Dashboard**: High-level statistical overview including total revenue, active orders, and low-stock alerts.
*   **Inventory Control**: Stock is managed strictly at the variant level and is automatically deducted upon successful payment verification.
*   **Catalogue Editing**: Full CRUD (Create, Read, Update, Delete) access to products and their variants.
*   **Order Fulfillment**: Admins can update order statuses, which triggers automated notification emails to the customer.

---

## 2. Tech Stack Overview

### Backend Architecture
The backend is a high-performance REST API built with Python, focusing on asynchronous operations.

*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
    *   *Why:* Provides automatic interactive API documentation (Swagger/OpenAPI), excellent performance due to ASGI/async capabilities, and data validation via Pydantic.
*   **Database**: [MongoDB](https://www.mongodb.com/)
    *   *Driver:* `motor` (AsyncIOMotorClient) for asynchronous, non-blocking database queries.
    *   *Why:* flexible document structure fits the complex, dynamic schemas of e-commerce products and variants.
*   **Authentication & Security**:
    *   Custom JWT-based session tokens stored in secure, HTTPOnly cookies.
    *   Google OAuth integrated via an external Emergent Auth provider.
    *   Password hashing using `bcrypt`.
*   **Integrations**:
    *   **Payments**: Razorpay API for handling transactions and signature verification.
    *   **Email**: Cloud email provider (using packages like `resend` + `Jinja2` templates) for transactional emails.
    *   **Cloud Storage**: AWS S3 (`boto3`) integration for handling/serving images.

### Frontend Architecture
The frontend is a modern, responsive Single Page Application (SPA) prioritizing aesthetics and user experience.

*   **Framework**: [React 19](https://react.dev/) (Bootstrapped likely with Create React App but extended via CRACO).
*   **Routing**: React Router DOM (v7) for client-side navigation.
*   **Styling & UI**:
    *   **Tailwind CSS**: Utility-first CSS framework for building the custom "Monochrome Luxury" design system (black, white, gold accents).
    *   **shadcn/ui & Radix UI**: High-quality, accessible headless UI components used extensively throughout the app.
    *   **Animation**: `tailwindcss-animate`, `framer-motion` (implied for premium feels), and `@lottiefiles/lottie-player`.
*   **State Management & Data Fetching**:
    *   `axios` for API calls to the FastAPI backend.
    *   Form handling and validation via `react-hook-form` paired with `zod`.
*   **Other Notable Tools**:
    *   **Date Formatting**: `date-fns` & `react-day-picker`.
    *   **Data Visualization**: `recharts` for the Admin Dashboard.
    *   **Notifications**: `sonner` for toast notifications.
    *   **Payments**: `react-razorpay` for embedding the payment gateway directly in the UI.

---

## 3. Design System & Aesthetics
According to the project's `design_guidelines.json`:
*   **Theme**: "Monochrome Luxury" (Strict Black & White palette with Gold `#D4AF37` reserved exclusively for accents/interactive states).
*   **Typography**: *Playfair Display* (Headings), *Manrope* (Body), *Cormorant Garamond* (Accents).
*   **Layout Style**: Generous whitespace, no rounded corners (`rounded-none`), "Tetris" asymmetrical grid for marketing pages, and high-contrast functionality for the dashboard.
