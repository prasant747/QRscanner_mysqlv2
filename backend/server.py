from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, Integer, DateTime, select
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta
import secrets
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# CI/CD Auto-registration test

# MySQL connection
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

app = FastAPI(title="QRConnect API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== DATABASE MODELS ==============

class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mobile_number = Column(String(15), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=True)
    qr_code = Column(String(20), unique=True, nullable=False, index=True)
    subscription_status = Column(String(20), default="pending")
    subscription_start_date = Column(DateTime, nullable=True)
    subscription_expiry_date = Column(DateTime, nullable=True)
    remaining_calls = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class CallLogModel(Base):
    __tablename__ = "call_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(20), nullable=False)

class PaymentModel(Base):
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    payment_type = Column(String(20), nullable=False)  # new, recharge, renew
    status = Column(String(20), default="success")  # success, failed, pending
    transaction_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# ============== PYDANTIC MODELS ==============

class SendOTPRequest(BaseModel):
    mobile_number: str

class VerifyOTPRequest(BaseModel):
    mobile_number: str
    otp: str

class CompleteRegistrationRequest(BaseModel):
    mobile_number: str
    name: str

class ProcessPaymentRequest(BaseModel):
    mobile_number: str
    amount: int = 100

class InitiateCallRequest(BaseModel):
    qr_code: str

class UserResponse(BaseModel):
    id: str
    mobile_number: str
    name: Optional[str]
    qr_code: str
    subscription_status: str
    subscription_start_date: Optional[str]
    subscription_expiry_date: Optional[str]
    remaining_calls: int
    created_at: str

class QRScanResponse(BaseModel):
    status: str
    message: str
    can_call: bool

class CallResponse(BaseModel):
    success: bool
    message: str
    call_status: str

# ============== OTP STORAGE ==============
otp_storage = {}

# ============== HELPER FUNCTIONS ==============

def generate_qr_code():
    chars = string.ascii_uppercase + string.digits
    return f"QRC_{''.join(secrets.choice(chars) for _ in range(8))}"

def user_to_dict(user: UserModel) -> dict:
    return {
        "id": user.id,
        "mobile_number": user.mobile_number,
        "name": user.name,
        "qr_code": user.qr_code,
        "subscription_status": user.subscription_status,
        "subscription_start_date": user.subscription_start_date.isoformat() if user.subscription_start_date else None,
        "subscription_expiry_date": user.subscription_expiry_date.isoformat() if user.subscription_expiry_date else None,
        "remaining_calls": user.remaining_calls,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

async def get_user_by_mobile(session: AsyncSession, mobile_number: str):
    result = await session.execute(select(UserModel).where(UserModel.mobile_number == mobile_number))
    return result.scalar_one_or_none()

async def get_user_by_qr(session: AsyncSession, qr_code: str):
    result = await session.execute(select(UserModel).where(UserModel.qr_code == qr_code))
    return result.scalar_one_or_none()

# ============== STARTUP/SHUTDOWN ==============

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()

# ============== AUTH ROUTES ==============

@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    mobile = request.mobile_number.strip()
    if len(mobile) < 10:
        raise HTTPException(status_code=400, detail="Invalid mobile number")
    
    # Format number for Twilio (add +91 for Indian numbers if not present)
    if not mobile.startswith('+'):
        mobile = '+91' + mobile
    
    try:
        from twilio.rest import Client
        client = Client(os.environ.get('TWILIO_ACCOUNT_SID'), os.environ.get('TWILIO_AUTH_TOKEN'))
        
        verification = client.verify.v2.services(os.environ.get('TWILIO_VERIFY_SERVICE_SID')) \
            .verifications.create(to=mobile, channel='sms')
        
        logger.info(f"OTP sent to {mobile}, status: {verification.status}")
        return {"success": True, "message": "OTP sent successfully"}
    except Exception as e:
        logger.error(f"Failed to send OTP: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to send OTP: {str(e)}")

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    mobile = request.mobile_number.strip()
    otp = request.otp.strip()
    
    # Format number for Twilio
    formatted_mobile = mobile if mobile.startswith('+') else '+91' + mobile
    
    try:
        from twilio.rest import Client
        client = Client(os.environ.get('TWILIO_ACCOUNT_SID'), os.environ.get('TWILIO_AUTH_TOKEN'))
        
        verification_check = client.verify.v2.services(os.environ.get('TWILIO_VERIFY_SERVICE_SID')) \
            .verification_checks.create(to=formatted_mobile, code=otp)
        
        if verification_check.status != "approved":
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        logger.info(f"OTP verified for {mobile}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OTP verification failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    async with async_session() as session:
        existing_user = await get_user_by_mobile(session, mobile)
        
        if existing_user:
            return {
                "success": True,
                "is_existing_user": True,
                "user": user_to_dict(existing_user),
                "message": "Login successful"
            }
        
        new_user = UserModel(
            id=str(uuid.uuid4()),
            mobile_number=mobile,
            qr_code=generate_qr_code(),
            subscription_status="pending",
            remaining_calls=0,
            created_at=datetime.now(timezone.utc)
        )
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)
        
        return {
            "success": True,
            "is_existing_user": False,
            "user": user_to_dict(new_user),
            "message": "OTP verified. Please complete registration."
        }

@api_router.post("/auth/complete-registration")
async def complete_registration(request: CompleteRegistrationRequest):
    mobile = request.mobile_number.strip()
    name = request.name.strip()
    
    if not name:
        raise HTTPException(status_code=400, detail="Name is required")
    
    async with async_session() as session:
        user = await get_user_by_mobile(session, mobile)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.name = name
        await session.commit()
        await session.refresh(user)
        
        return {"success": True, "user": user_to_dict(user), "message": "Registration updated"}

# ============== PAYMENT ROUTES ==============

@api_router.post("/payment/process")
async def process_payment(request: ProcessPaymentRequest):
    mobile = request.mobile_number.strip()
    
    async with async_session() as session:
        user = await get_user_by_mobile(session, mobile)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Determine payment type
        if user.subscription_status == "pending":
            payment_type = "new"
        elif user.subscription_status == "expired" or (user.subscription_expiry_date and datetime.now().replace(tzinfo=None) > user.subscription_expiry_date.replace(tzinfo=None)):
            payment_type = "recharge"
        elif user.remaining_calls <= 0:
            payment_type = "renew"
        else:
            payment_type = "topup"
        
        start_date = datetime.now(timezone.utc)
        expiry_date = start_date + timedelta(days=365)
        
        # Update user subscription
        user.subscription_status = "active"
        user.subscription_start_date = start_date
        user.subscription_expiry_date = expiry_date
        user.remaining_calls = 20
        
        # Record payment
        payment = PaymentModel(
            id=str(uuid.uuid4()),
            user_id=user.id,
            amount=request.amount,
            payment_type=payment_type,
            status="success",
            transaction_id=f"TXN_{secrets.token_hex(8).upper()}",
            created_at=datetime.now(timezone.utc)
        )
        session.add(payment)
        await session.commit()
        await session.refresh(user)
        
        logger.info(f"Payment processed for {mobile}: ₹{request.amount} ({payment_type})")
        return {
            "success": True,
            "message": "Payment successful. Subscription activated!",
            "user": user_to_dict(user),
            "payment_type": payment_type
        }

# ============== USER ROUTES ==============

@api_router.get("/user/dashboard/{mobile_number}")
async def get_dashboard(mobile_number: str):
    async with async_session() as session:
        user = await get_user_by_mobile(session, mobile_number)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.subscription_expiry_date and datetime.now().replace(tzinfo=None) > user.subscription_expiry_date.replace(tzinfo=None):
            user.subscription_status = "expired"
            await session.commit()
        
        return user_to_dict(user)

@api_router.get("/user/call-logs/{mobile_number}")
async def get_call_logs(mobile_number: str):
    async with async_session() as session:
        user = await get_user_by_mobile(session, mobile_number)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        result = await session.execute(
            select(CallLogModel).where(CallLogModel.user_id == user.id).order_by(CallLogModel.timestamp.desc())
        )
        logs = result.scalars().all()
        
        return {
            "success": True,
            "logs": [{"id": l.id, "timestamp": l.timestamp.isoformat(), "status": l.status} for l in logs]
        }

# ============== SCAN & CALL ROUTES ==============

@api_router.get("/scan/{qr_code}", response_model=QRScanResponse)
async def scan_qr(qr_code: str):
    async with async_session() as session:
        user = await get_user_by_qr(session, qr_code)
        
        if not user:
            return QRScanResponse(status="invalid", message="This QR code is not registered with QRConnect.", can_call=False)
        
        if user.subscription_status != "active":
            return QRScanResponse(status="inactive", message="This QR is not active. The owner's subscription has expired.", can_call=False)
        
        if user.remaining_calls <= 0:
            return QRScanResponse(status="exhausted", message="This QR is not active. Call limit has been reached.", can_call=False)
        
        if user.subscription_expiry_date and datetime.now().replace(tzinfo=None) > user.subscription_expiry_date.replace(tzinfo=None):
            return QRScanResponse(status="expired", message="This QR is not active. The subscription has expired.", can_call=False)
        
        return QRScanResponse(status="active", message="This QR is registered with QRConnect. Click below to contact the owner anonymously.", can_call=True)

@api_router.post("/call/initiate", response_model=CallResponse)
async def initiate_call(request: InitiateCallRequest):
    async with async_session() as session:
        user = await get_user_by_qr(session, request.qr_code)
        
        if not user:
            raise HTTPException(status_code=404, detail="QR code not found")
        if user.subscription_status != "active":
            raise HTTPException(status_code=400, detail="QR is not active")
        if user.remaining_calls <= 0:
            raise HTTPException(status_code=400, detail="Call limit reached")
        
        import asyncio
        await asyncio.sleep(2)  # Simulate call connection
        
        user.remaining_calls -= 1
        call_log = CallLogModel(id=str(uuid.uuid4()), user_id=user.id, status="connected")
        session.add(call_log)
        await session.commit()
        
        logger.info(f"Call initiated for QR: {request.qr_code}")
        return CallResponse(success=True, message="Call connected successfully!", call_status="connected")
    
@api_router.get("/user/payments/{mobile_number}")
async def get_payments(mobile_number: str):
    async with async_session() as session:
        user = await get_user_by_mobile(session, mobile_number)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        result = await session.execute(
            select(PaymentModel).where(PaymentModel.user_id == user.id).order_by(PaymentModel.created_at.desc())
        )
        payments = result.scalars().all()
        
        return {
            "success": True,
            "payments": [
                {
                    "id": p.id,
                    "amount": p.amount,
                    "payment_type": p.payment_type,
                    "status": p.status,
                    "transaction_id": p.transaction_id,
                    "created_at": p.created_at.isoformat() if p.created_at else None
                }
                for p in payments
            ]
        }

# ============== HEALTH CHECK ==============

@api_router.get("/")
async def root():
    return {"message": "QRConnect API is running", "version": "1.0.0", "database": "MySQL"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "MySQL", "timestamp": datetime.now(timezone.utc).isoformat()}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
