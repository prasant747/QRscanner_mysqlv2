# QRConnect - Product Requirements Document

## Overview
QRConnect is a privacy-first QR-based anonymous calling application for safety and peace of mind. Users can generate unique QR codes to attach to belongings (kids' bags, cars, wallets). Anyone who finds the item can scan the QR and contact the owner without revealing either party's phone number.

## User Personas
1. **Parents** - Want to protect their children with a QR on school bags
2. **Vehicle Owners** - Need a way to be contacted about parking issues or accidents
3. **Travelers** - Want to protect luggage and valuables during travel
4. **General Users** - Anyone wanting to protect wallets, keys, or other personal items

## Core Requirements (Static)
- One unique QR code per registered user
- Anonymous calling (both parties' identities protected)
- ₹100/year subscription with 20 calls included
- OTP-based authentication
- QR code download/print functionality
- Scanner-friendly web page (no app required)

## What's Been Implemented (v1.0 - Jan 2026)

### Backend (FastAPI + MongoDB)
- [x] User registration with OTP verification
- [x] User authentication (login via OTP)
- [x] QR code generation (unique per user)
- [x] Subscription management (status, expiry, remaining calls)
- [x] Payment processing (MOCK)
- [x] QR scanning endpoint
- [x] Call initiation with call count decrement
- [x] Call logs tracking

### Frontend (React)
- [x] Landing page with hero, features, pricing sections
- [x] 4-step registration flow (Mobile → OTP → Name → Payment)
- [x] Login page with OTP verification
- [x] User dashboard with:
  - QR code display
  - QR download button
  - Copy link button
  - Subscription status
  - Remaining calls counter
  - Expiry date
- [x] Scanner page with:
  - QR verification
  - "Call Owner" button
  - Call connection states
  - Inactive QR handling

### Mocked Features (for MVP testing)
- **OTP**: Always accepts "123456"
- **Payment**: Always succeeds (₹100)
- **Calling**: Simulates 2-second connection delay

## Database Schema

### Users Collection
```json
{
  "id": "uuid",
  "mobile_number": "string (unique)",
  "name": "string",
  "qr_code": "string (unique, e.g., QRC_xxxxxxxx)",
  "subscription_status": "pending|active|expired",
  "subscription_start_date": "ISO datetime",
  "subscription_expiry_date": "ISO datetime",
  "remaining_calls": "integer (max 20)",
  "created_at": "ISO datetime"
}
```

### Call_Logs Collection
```json
{
  "id": "uuid",
  "user_id": "string (user reference)",
  "timestamp": "ISO datetime",
  "status": "connected|failed|missed"
}
```

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/send-otp | POST | Send OTP to mobile |
| /api/auth/verify-otp | POST | Verify OTP |
| /api/auth/complete-registration | POST | Save user name |
| /api/payment/process | POST | Process mock payment |
| /api/user/dashboard/{mobile} | GET | Get user dashboard data |
| /api/user/call-logs/{mobile} | GET | Get call history |
| /api/scan/{qr_code} | GET | Check QR status (public) |
| /api/call/initiate | POST | Initiate call (decrements counter) |

## Prioritized Backlog

### P0 - Critical (For Production)
1. Real OTP integration (Twilio/MSG91)
2. Real payment gateway (Razorpay UPI)
3. Real anonymous calling (Twilio Proxy/similar)

### P1 - High Priority
1. Call history page for users
2. Recharge/top-up functionality when calls exhausted
3. Multiple QR codes per user with labels
4. Email notifications for subscription expiry

### P2 - Nice to Have
1. Location sharing when QR is scanned
2. Text message option for scanner
3. Emergency contacts (backup numbers)
4. Admin panel for user management
5. Analytics dashboard

## Next Action Items
1. Integrate real OTP service (MSG91/Twilio)
2. Integrate Razorpay for UPI payments
3. Integrate Twilio Proxy for anonymous calling
4. Add subscription renewal flow
5. Add call history page
