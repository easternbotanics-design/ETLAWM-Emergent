import os
import resend
from typing import Dict, Any

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY', '')

NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', 'onboarding@resend.dev')
COMPANY_NAME = os.environ.get('COMPANY_NAME', 'ETLAWM')
COMPANY_EMAIL = os.environ.get('COMPANY_EMAIL', 'support@etlawm.com')

def send_order_confirmation_email(to_email: str, order_data: Dict[str, Any]) -> bool:
    """Send order confirmation email to customer"""
    try:
        # Build items HTML
        items_html = ""
        for item in order_data['items']:
            variant_text = f" ({item['variant_name']})" if item.get('variant_name') else ""
            items_html += f"""
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">
                        {item['product_name']}{variant_text}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
                        {item['quantity']}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                        Rs.{item['price']:.2f}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">
                        Rs.{(item['price'] * item['quantity']):.2f}
                    </td>
                </tr>
            """
        
        shipping = order_data['shipping_address']
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Manrope', Arial, sans-serif; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #000;">
                <!-- Header -->
                <div style="background: #000; color: #D4AF37; padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 36px; letter-spacing: 2px;">
                        {COMPANY_NAME}
                    </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #000;">
                        Order Confirmed! 🎉
                    </h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                        Thank you for your order! We're excited to prepare your luxury beauty products.
                    </p>
                    
                    <div style="background: #f9f9f9; padding: 20px; margin-bottom: 30px; border-left: 3px solid #D4AF37;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                            Order ID
                        </p>
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #000;">
                            {order_data['order_id']}
                        </p>
                    </div>
                    
                    <!-- Order Items -->
                    <h3 style="margin: 30px 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666;">
                        Order Summary
                    </h3>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="background: #f9f9f9;">
                                <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Product</th>
                                <th style="padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Qty</th>
                                <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Price</th>
                                <th style="padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items_html}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f9f9f9;">
                                <td colspan="3" style="padding: 15px; font-weight: 600; font-size: 16px;">Total Amount</td>
                                <td style="padding: 15px; text-align: right; font-weight: 600; font-size: 18px; color: #000;">
                                    Rs.{order_data['total_amount']:.2f}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <!-- Shipping Address -->
                    <h3 style="margin: 30px 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #666;">
                        Shipping Address
                    </h3>
                    
                    <div style="background: #f9f9f9; padding: 20px; line-height: 1.6; color: #333;">
                        <strong>{shipping['name']}</strong><br>
                        {shipping['address']}<br>
                        {shipping['city']}, {shipping['state']} - {shipping['pincode']}<br>
                        Phone: {shipping['phone']}
                    </div>
                    
                    <!-- Next Steps -->
                    <div style="margin-top: 40px; padding: 20px; background: #fffbf0; border: 1px solid #D4AF37;">
                        <p style="margin: 0 0 10px 0; font-weight: 600; color: #000;">What's Next?</p>
                        <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">
                            Your order is being processed. You'll receive another email once your items are shipped.
                            Track your order anytime at www.etlawm.com/orders
                        </p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        Need help? Contact us at <a href="mailto:{COMPANY_EMAIL}" style="color: #D4AF37; text-decoration: none;">{COMPANY_EMAIL}</a>
                    </p>
                    <p style="margin: 0; color: #999; font-size: 12px;">
                        © 2026 {COMPANY_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        resend.Emails.send({
            "from": NOTIFICATION_EMAIL,
            "to": to_email,
            "subject": f"Order Confirmed - {order_data['order_id']} | {COMPANY_NAME}",
            "html": html_content
        })
        
        return True
    except Exception as e:
        print(f"Failed to send order confirmation email: {str(e)}")
        return False


def send_order_status_update_email(to_email: str, order_data: Dict[str, Any], new_status: str) -> bool:
    """Send order status update email"""
    try:
        status_messages = {
            "confirmed": {
                "title": "Payment Confirmed ✅",
                "message": "Your payment has been received and your order is confirmed.",
                "icon": "✅"
            },
            "shipped": {
                "title": "Your Order Has Been Shipped! 📦",
                "message": "Your order is on its way! You'll receive it soon.",
                "icon": "📦"
            },
            "delivered": {
                "title": "Order Delivered! 🎉",
                "message": "Your order has been successfully delivered. Enjoy your luxury beauty products!",
                "icon": "🎉"
            },
            "cancelled": {
                "title": "Order Cancelled ❌",
                "message": "Your order has been cancelled. If you didn't request this, please contact us.",
                "icon": "❌"
            }
        }
        
        status_info = status_messages.get(new_status, {
            "title": "Order Status Updated",
            "message": f"Your order status has been updated to: {new_status}",
            "icon": "📋"
        })
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Manrope', Arial, sans-serif; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #000;">
                <!-- Header -->
                <div style="background: #000; color: #D4AF37; padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 36px; letter-spacing: 2px;">
                        {COMPANY_NAME}
                    </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">
                        {status_info['icon']}
                    </div>
                    
                    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #000;">
                        {status_info['title']}
                    </h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                        {status_info['message']}
                    </p>
                    
                    <div style="background: #f9f9f9; padding: 20px; margin-bottom: 30px; border-left: 3px solid #D4AF37; text-align: left;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                            Order ID
                        </p>
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #000;">
                            {order_data['order_id']}
                        </p>
                    </div>
                    
                    <a href="https://www.etlawm.com/orders/{order_data['order_id']}" 
                       style="display: inline-block; background: #000; color: white; padding: 15px 40px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; margin-top: 20px;">
                        Track Order
                    </a>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        Need help? Contact us at <a href="mailto:{COMPANY_EMAIL}" style="color: #D4AF37; text-decoration: none;">{COMPANY_EMAIL}</a>
                    </p>
                    <p style="margin: 0; color: #999; font-size: 12px;">
                        © 2026 {COMPANY_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        resend.Emails.send({
            "from": NOTIFICATION_EMAIL,
            "to": to_email,
            "subject": f"{status_info['title']} - Order {order_data['order_id']} | {COMPANY_NAME}",
            "html": html_content
        })
        
        return True
    except Exception as e:
        print(f"Failed to send status update email: {str(e)}")
        return False


def send_payment_success_email(to_email: str, order_data: Dict[str, Any], payment_id: str) -> bool:
    """Send payment success confirmation"""
    try:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Manrope', Arial, sans-serif; background-color: #f9f9f9;">
            <div style="max-width: 600px; margin: 40px auto; background: white; border: 1px solid #000;">
                <!-- Header -->
                <div style="background: #000; color: #D4AF37; padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 36px; letter-spacing: 2px;">
                        {COMPANY_NAME}
                    </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                    
                    <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #000;">
                        Payment Successful!
                    </h2>
                    
                    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                        Your payment of <strong style="color: #000;">Rs.{order_data['total_amount']:.2f}</strong> has been received successfully.
                    </p>
                    
                    <div style="background: #f9f9f9; padding: 20px; margin-bottom: 20px; text-align: left;">
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                            Payment ID
                        </p>
                        <p style="margin: 0 0 20px 0; font-size: 14px; font-family: monospace; color: #000;">
                            {payment_id}
                        </p>
                        
                        <p style="margin: 0 0 10px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                            Order ID
                        </p>
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #000;">
                            {order_data['order_id']}
                        </p>
                    </div>
                    
                    <div style="background: #e8f5e9; padding: 20px; border-left: 3px solid #4caf50; text-align: left; margin-top: 30px;">
                        <p style="margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.6;">
                            <strong>Next Steps:</strong><br>
                            We're now processing your order and will ship it soon. You'll receive a shipping confirmation once your items are on the way.
                        </p>
                    </div>
                    
                    <a href="https://www.etlawm.com/orders/{order_data['order_id']}" 
                       style="display: inline-block; background: #000; color: white; padding: 15px 40px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; margin-top: 30px;">
                        View Order Details
                    </a>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                        Need help? Contact us at <a href="mailto:{COMPANY_EMAIL}" style="color: #D4AF37; text-decoration: none;">{COMPANY_EMAIL}</a>
                    </p>
                    <p style="margin: 0; color: #999; font-size: 12px;">
                        © 2026 {COMPANY_NAME}. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        resend.Emails.send({
            "from": NOTIFICATION_EMAIL,
            "to": to_email,
            "subject": f"Payment Received - Rs.{order_data['total_amount']:.2f} | {COMPANY_NAME}",
            "html": html_content
        })
        
        return True
    except Exception as e:
        print(f"Failed to send payment success email: {str(e)}")
        return False
