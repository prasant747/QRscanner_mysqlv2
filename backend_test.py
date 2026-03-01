#!/usr/bin/env python3
import requests
import sys
import json
from datetime import datetime

class QRConnectAPITester:
    def __init__(self, base_url="https://qr-guardian-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_mobile = f"98765{datetime.now().strftime('%H%M%S')}"  # Dynamic mobile for testing
        self.user_data = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json() if response.content else response.text
                    self.log(f"   Error details: {error_detail}")
                except:
                    self.log(f"   Raw response: {response.text}")
                return False, {}
                
        except Exception as e:
            self.log(f"❌ {name} - Network Error: {str(e)}")
            return False, {}
    
    def test_health_endpoints(self):
        """Test basic health and root endpoints"""
        self.log("🏥 Testing Health Endpoints...")
        
        # Test root endpoint
        success1, _ = self.run_test("Root Endpoint", "GET", "", 200)
        
        # Test health endpoint
        success2, _ = self.run_test("Health Check", "GET", "health", 200)
        
        return success1 and success2
    
    def test_auth_flow(self):
        """Test complete authentication flow"""
        self.log("🔐 Testing Authentication Flow...")
        
        # Step 1: Send OTP
        success, response = self.run_test(
            "Send OTP",
            "POST", 
            "auth/send-otp",
            200,
            {"mobile_number": self.test_mobile}
        )
        
        if not success:
            self.log("❌ Cannot proceed without OTP sending working")
            return False
        
        # Step 2: Verify OTP (mock 123456)
        success, response = self.run_test(
            "Verify OTP (New User)",
            "POST",
            "auth/verify-otp", 
            200,
            {"mobile_number": self.test_mobile, "otp": "123456"}
        )
        
        if success and response:
            self.user_data = response.get('user')
            self.log(f"   New user created with ID: {self.user_data.get('id') if self.user_data else 'None'}")
            
            # Step 3: Complete registration with name
            success, response = self.run_test(
                "Complete Registration",
                "POST",
                "auth/complete-registration",
                200,
                {"mobile_number": self.test_mobile, "name": "Test User"}
            )
            
            if success:
                self.user_data = response.get('user')
                self.log(f"   Registration completed for: {self.user_data.get('name') if self.user_data else 'Unknown'}")
                return True
        
        return False
    
    def test_payment_flow(self):
        """Test payment processing"""
        self.log("💳 Testing Payment Flow...")
        
        if not self.user_data:
            self.log("❌ Cannot test payment without user data")
            return False
            
        success, response = self.run_test(
            "Process Payment",
            "POST",
            "payment/process",
            200,
            {"mobile_number": self.test_mobile, "amount": 100}
        )
        
        if success and response:
            self.user_data = response.get('user')
            subscription_status = self.user_data.get('subscription_status') if self.user_data else None
            remaining_calls = self.user_data.get('remaining_calls') if self.user_data else None
            
            if subscription_status == "active" and remaining_calls == 20:
                self.log(f"   Payment successful - Status: {subscription_status}, Calls: {remaining_calls}")
                return True
            else:
                self.log(f"❌ Payment issues - Status: {subscription_status}, Calls: {remaining_calls}")
        
        return False
    
    def test_dashboard_access(self):
        """Test dashboard data retrieval"""
        self.log("📊 Testing Dashboard Access...")
        
        if not self.user_data:
            self.log("❌ Cannot test dashboard without user data")
            return False
            
        success, response = self.run_test(
            "Get Dashboard Data",
            "GET",
            f"user/dashboard/{self.test_mobile}",
            200
        )
        
        if success and response:
            qr_code = response.get('qr_code')
            subscription_status = response.get('subscription_status')
            remaining_calls = response.get('remaining_calls')
            
            self.log(f"   Dashboard loaded - QR: {qr_code}, Status: {subscription_status}, Calls: {remaining_calls}")
            return True
        
        return False
    
    def test_qr_scanning(self):
        """Test QR code scanning functionality"""
        self.log("📱 Testing QR Scanning...")
        
        if not self.user_data or not self.user_data.get('qr_code'):
            self.log("❌ Cannot test QR scanning without QR code")
            return False
            
        qr_code = self.user_data.get('qr_code')
        
        # Test QR scan for active subscription
        success, response = self.run_test(
            "Scan Active QR",
            "GET",
            f"scan/{qr_code}",
            200
        )
        
        if success and response:
            status = response.get('status')
            can_call = response.get('can_call')
            message = response.get('message')
            
            if status == "active" and can_call:
                self.log(f"   QR scan successful - Status: {status}, Can call: {can_call}")
                return True
            else:
                self.log(f"❌ QR scan issues - Status: {status}, Can call: {can_call}")
        
        return False
    
    def test_call_functionality(self):
        """Test call initiation and call counting"""
        self.log("📞 Testing Call Functionality...")
        
        if not self.user_data or not self.user_data.get('qr_code'):
            self.log("❌ Cannot test calls without QR code")
            return False
            
        qr_code = self.user_data.get('qr_code')
        initial_calls = self.user_data.get('remaining_calls', 0)
        
        # Test call initiation
        success, response = self.run_test(
            "Initiate Call",
            "POST",
            "call/initiate",
            200,
            {"qr_code": qr_code}
        )
        
        if success and response:
            call_success = response.get('success')
            call_status = response.get('call_status')
            
            if call_success and call_status == "connected":
                self.log(f"   Call initiated successfully - Status: {call_status}")
                
                # Verify call count decreased
                dashboard_success, dashboard_data = self.run_test(
                    "Verify Call Counter",
                    "GET",
                    f"user/dashboard/{self.test_mobile}",
                    200
                )
                
                if dashboard_success and dashboard_data:
                    new_calls = dashboard_data.get('remaining_calls', 0)
                    if new_calls == initial_calls - 1:
                        self.log(f"   Call counter updated correctly: {initial_calls} -> {new_calls}")
                        return True
                    else:
                        self.log(f"❌ Call counter not updated: {initial_calls} -> {new_calls}")
                
            else:
                self.log(f"❌ Call initiation failed - Success: {call_success}, Status: {call_status}")
        
        return False
    
    def test_existing_user_login(self):
        """Test login flow for existing user"""
        self.log("🔄 Testing Existing User Login...")
        
        # Try to verify OTP again (should return existing user)
        success, response = self.run_test(
            "Login Existing User",
            "POST",
            "auth/verify-otp",
            200,
            {"mobile_number": self.test_mobile, "otp": "123456"}
        )
        
        if success and response:
            is_existing = response.get('is_existing_user')
            user = response.get('user')
            
            if is_existing and user:
                self.log(f"   Existing user login successful - Name: {user.get('name')}")
                return True
            else:
                self.log(f"❌ Existing user login failed - Is existing: {is_existing}")
        
        return False
    
    def test_invalid_scenarios(self):
        """Test error scenarios"""
        self.log("⚠️ Testing Invalid Scenarios...")
        
        test_scenarios = [
            ("Invalid OTP", "POST", "auth/verify-otp", 400, {"mobile_number": self.test_mobile, "otp": "000000"}),
            ("Invalid Mobile", "POST", "auth/send-otp", 400, {"mobile_number": "123"}),
            ("Invalid QR Code", "GET", "scan/INVALID_QR", 200, None),  # Should return invalid status
            ("Non-existent User Dashboard", "GET", "user/dashboard/0000000000", 404, None),
        ]
        
        passed_scenarios = 0
        for name, method, endpoint, expected_status, data in test_scenarios:
            success, _ = self.run_test(name, method, endpoint, expected_status, data)
            if success:
                passed_scenarios += 1
        
        self.log(f"   Invalid scenarios tests: {passed_scenarios}/{len(test_scenarios)} passed")
        return passed_scenarios == len(test_scenarios)
    
    def run_all_tests(self):
        """Run complete test suite"""
        self.log("🚀 Starting QRConnect API Test Suite")
        self.log(f"   Test Mobile: {self.test_mobile}")
        self.log(f"   API Base URL: {self.api_url}")
        
        # Test sequence
        tests = [
            ("Health Endpoints", self.test_health_endpoints),
            ("Authentication Flow", self.test_auth_flow),
            ("Payment Processing", self.test_payment_flow), 
            ("Dashboard Access", self.test_dashboard_access),
            ("QR Code Scanning", self.test_qr_scanning),
            ("Call Functionality", self.test_call_functionality),
            ("Existing User Login", self.test_existing_user_login),
            ("Invalid Scenarios", self.test_invalid_scenarios),
        ]
        
        failed_tests = []
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*60}")
            try:
                if not test_func():
                    failed_tests.append(test_name)
                    self.log(f"❌ {test_name} FAILED")
                else:
                    self.log(f"✅ {test_name} PASSED")
            except Exception as e:
                failed_tests.append(test_name)
                self.log(f"❌ {test_name} ERROR: {str(e)}")
        
        # Final results
        self.log(f"\n{'='*60}")
        self.log(f"📊 FINAL RESULTS")
        self.log(f"   Total API calls: {self.tests_run}")
        self.log(f"   Successful calls: {self.tests_passed}")
        self.log(f"   API Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        self.log(f"   Test Suites Passed: {len(tests)-len(failed_tests)}/{len(tests)}")
        
        if failed_tests:
            self.log(f"❌ Failed test suites: {', '.join(failed_tests)}")
            return False
        else:
            self.log("✅ All test suites passed!")
            return True

def main():
    tester = QRConnectAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())