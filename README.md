# QRConnect - MySQL Version

A privacy-first QR-based anonymous calling application. Generate unique QR codes to attach to belongings (kids' bags, cars, wallets). Anyone who finds the item can scan and contact the owner without revealing either party's phone number.

## Features

- 🔐 **OTP-based authentication** (Mock: use `123456`)
- 💳 **Subscription system** - ₹100/year for 20 anonymous calls
- 📱 **QR Code generation** - Unique code per user
- 📞 **Anonymous calling** - Both parties' identities protected
- 🖨️ **Download & Print** - QR codes for physical use

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, SQLAlchemy (async)
- **Database**: MySQL

---

## 🚀 Quick Start (Local Development)

### 1. Create MySQL Database

Open MySQL Workbench and run:
```sql
CREATE DATABASE qrconnect_db;
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Update .env with your MySQL credentials
# DATABASE_URL=mysql+aiomysql://root:YOUR_PASSWORD@localhost:3306/qrconnect_db

# Run server (tables auto-create on startup)
uvicorn server:app --reload --port 8001
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Run development server
yarn start
```

### 4. Test the App

1. Open `http://localhost:3000`
2. Register with any 10-digit mobile number
3. Use OTP: `123456`
4. Complete payment (auto-succeeds)
5. Download your QR code!

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=mysql+aiomysql://root:your_password@localhost:3306/qrconnect_db
CORS_ORIGINS=*
```

### Frontend (`frontend/.env`)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Database Schema (Auto-created)

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| mobile_number | VARCHAR(15) | Unique, indexed |
| name | VARCHAR(100) | User's name |
| qr_code | VARCHAR(20) | Unique QR identifier |
| subscription_status | VARCHAR(20) | pending/active/expired |
| subscription_start_date | DATETIME | Subscription start |
| subscription_expiry_date | DATETIME | Subscription end |
| remaining_calls | INT | Calls remaining (max 20) |
| created_at | DATETIME | Account creation time |

### Call Logs Table
| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key (UUID) |
| user_id | VARCHAR(36) | Foreign key to users |
| timestamp | DATETIME | Call time |
| status | VARCHAR(20) | connected/failed/missed |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-otp` | Send OTP to mobile |
| POST | `/api/auth/verify-otp` | Verify OTP (use: 123456) |
| POST | `/api/auth/complete-registration` | Save user name |
| POST | `/api/payment/process` | Process mock payment |
| GET | `/api/user/dashboard/{mobile}` | Get user data |
| GET | `/api/user/call-logs/{mobile}` | Get call history |
| GET | `/api/scan/{qr_code}` | Check QR status (public) |
| POST | `/api/call/initiate` | Initiate anonymous call |

---

## Project Structure

```
├── backend/
│   ├── server.py          # FastAPI application (MySQL)
│   ├── requirements.txt   # Python dependencies
│   └── .env               # Database configuration
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # UI components
│   │   ├── App.js
│   │   └── index.css
│   ├── package.json
│   └── .env
└── README.md
```

---

## AWS Deployment

### 1. Create RDS MySQL Instance
- Engine: MySQL 8.0
- Create database: `qrconnect_db`

### 2. Update Backend `.env`
```env
DATABASE_URL=mysql+aiomysql://admin:password@your-rds-endpoint.amazonaws.com:3306/qrconnect_db
CORS_ORIGINS=https://yourdomain.com
```

### 3. Update Frontend `.env`
```env
REACT_APP_BACKEND_URL=https://api.yourdomain.com
```

### 4. Deploy
- Backend: EC2, ECS, or Lambda
- Frontend: S3 + CloudFront or Amplify

---

## Mock Features (Replace for Production)

| Feature | Current (Mock) | Production |
|---------|----------------|------------|
| OTP | Always `123456` | Twilio/MSG91 |
| Payment | Auto-success | Razorpay UPI |
| Calling | 2s delay simulation | Twilio Proxy |

---

## License

MIT License
