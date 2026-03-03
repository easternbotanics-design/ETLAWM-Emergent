import requests
import sys
import json
from datetime import datetime

class ETLAWMAPITester:
    def __init__(self, base_url="https://etlawm-boutique.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_product_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth token if available
        token = self.admin_token if use_admin else self.session_token
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": test_email,
                "password": "TestPass123!",
                "name": "Test User"
            }
        )
        if success and 'user_id' in response:
            self.test_user_id = response['user_id']
            print(f"   Created user: {test_email}")
            return test_email
        return None

    def test_user_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'session_token' in response:
            self.session_token = response['session_token']
            print(f"   Session token obtained")
            return True
        return False

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@etlawm.com", "password": "admin123"}
        )
        if success and 'session_token' in response:
            self.admin_token = response['session_token']
            print(f"   Admin session token obtained")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_products(self):
        """Test get products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        if success and isinstance(response, list) and len(response) > 0:
            self.test_product_id = response[0].get('product_id')
            print(f"   Found {len(response)} products")
            return True
        return success

    def test_get_featured_products(self):
        """Test get featured products"""
        success, response = self.run_test(
            "Get Featured Products",
            "GET",
            "products?featured=true",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} featured products")
            return True
        return success

    def test_get_categories(self):
        """Test get categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        if success and 'categories' in response:
            print(f"   Found categories: {response['categories']}")
            return True
        return success

    def test_get_product_detail(self):
        """Test get product detail"""
        if not self.test_product_id:
            print("❌ No product ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Product Detail",
            "GET",
            f"products/{self.test_product_id}",
            200
        )
        return success

    def test_cart_operations(self):
        """Test cart operations"""
        # Get cart
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        if not success:
            return False

        # Add item to cart (if we have a product)
        if self.test_product_id:
            success, response = self.run_test(
                "Add to Cart",
                "POST",
                "cart/items",
                200,
                data={
                    "product_id": self.test_product_id,
                    "quantity": 1
                }
            )
            if not success:
                return False

        return True

    def test_wishlist_operations(self):
        """Test wishlist operations"""
        # Get wishlist
        success, response = self.run_test(
            "Get Wishlist",
            "GET",
            "wishlist",
            200
        )
        if not success:
            return False

        # Add to wishlist (if we have a product)
        if self.test_product_id:
            success, response = self.run_test(
                "Add to Wishlist",
                "POST",
                f"wishlist/{self.test_product_id}",
                200
            )
            if not success:
                return False

        return True

    def test_orders(self):
        """Test get orders"""
        success, response = self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200
        )
        return success

    def test_admin_stats(self):
        """Test admin stats"""
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            use_admin=True
        )
        if success:
            print(f"   Stats: {response}")
        return success

    def test_logout(self):
        """Test logout"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        return success

def main():
    print("🚀 Starting ETLAWM API Testing...")
    tester = ETLAWMAPITester()
    
    # Test public endpoints first
    print("\n📋 Testing Public Endpoints...")
    tester.test_get_products()
    tester.test_get_featured_products()
    tester.test_get_categories()
    
    if tester.test_product_id:
        tester.test_get_product_detail()
    
    # Test user registration and authentication
    print("\n👤 Testing User Authentication...")
    test_email = tester.test_user_registration()
    if not test_email:
        print("❌ User registration failed, stopping user tests")
    else:
        if tester.test_user_login(test_email, "TestPass123!"):
            tester.test_get_me()
            
            # Test protected user endpoints
            print("\n🛒 Testing User Protected Endpoints...")
            tester.test_cart_operations()
            tester.test_wishlist_operations()
            tester.test_orders()
            tester.test_logout()
    
    # Test admin authentication
    print("\n👑 Testing Admin Authentication...")
    if tester.test_admin_login():
        tester.test_admin_stats()
    
    # Print final results
    print(f"\n📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())