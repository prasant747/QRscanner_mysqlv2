import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QrCode, ArrowLeft, Phone, User, CreditCard, Check, Loader2 } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [userData, setUserData] = useState(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const steps = [
    { num: 1, label: "Mobile", icon: <Phone className="w-4 h-4" /> },
    { num: 2, label: "Verify", icon: <Check className="w-4 h-4" /> },
    { num: 3, label: "Details", icon: <User className="w-4 h-4" /> },
    { num: 4, label: "Payment", icon: <CreditCard className="w-4 h-4" /> }
  ];

  const handleSendOTP = async () => {
    if (mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { mobile_number: mobile });
      toast.success("OTP sent to your phone!");
      setOtp("");
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send OTP");
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.trim();
    
    if (otpValue.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/verify-otp`, {
        mobile_number: mobile,
        otp: otpValue
      });
      setUserData(response.data.user);
      
      if (response.data.is_existing_user && response.data.user.subscription_status === "active") {
        localStorage.setItem("qrconnect_user", JSON.stringify(response.data.user));
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else if (response.data.is_existing_user && response.data.user.name) {
        setName(response.data.user.name);
        setStep(4);
      } else {
        toast.success("OTP verified! Please complete your profile");
        setStep(3);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid OTP");
    }
    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/complete-registration`, {
        mobile_number: mobile,
        name: name.trim()
      });
      setUserData(response.data.user);
      toast.success("Profile saved!");
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save details");
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Step 1: Create Razorpay order
      const orderResponse = await axios.post(`${API}/payment/create-order`, {
        mobile_number: mobile,
        amount: 100
      });

      const { order_id, amount, currency, key_id } = orderResponse.data;

      // Step 2: Open Razorpay checkout
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "QRConnect",
        description: "Annual Subscription - 20 Anonymous Calls",
        order_id: order_id,
        handler: async function (response) {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await axios.post(`${API}/payment/verify`, {
              mobile_number: mobile,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            localStorage.setItem("qrconnect_user", JSON.stringify(verifyResponse.data.user));
            toast.success("Payment successful! Your QR is ready");
            navigate("/dashboard");
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: name || userData?.name || "",
          contact: mobile
        },
        theme: {
          color: "#0F4C5C"
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.error("Payment cancelled");
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => step > 1 ? setStep(step - 1) : navigate("/")}
          className="flex items-center gap-2 text-[#0F4C5C] hover:text-[#0A333E] transition-colors"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0F4C5C] flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-[#0F4C5C]">QRConnect</span>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="px-6 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-[#F0EFEA]">
              <div 
                className="h-full bg-[#E36414] transition-all duration-500"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              ></div>
            </div>
            
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center relative z-10">
                <div 
                  className={`step-indicator ${
                    step > s.num ? "completed" : step === s.num ? "active" : "pending"
                  }`}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.icon}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  step >= s.num ? "text-[#0F4C5C]" : "text-[#5F6C7B]"
                }`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* Step 1: Mobile Number */}
          {step === 1 && (
            <div className="animate-fade-in-up" data-testid="step-1">
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-2">
                Enter your mobile number
              </h1>
              <p className="text-[#5F6C7B] mb-8">
                We'll send you a verification code
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mobile" className="text-[#0F4C5C] font-medium">
                    Mobile Number
                  </Label>
                  <div className="mt-2 relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6C7B]">
                      +91
                    </span>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="pl-14 h-14 text-lg rounded-xl border-[#0F4C5C]/20 focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#0F4C5C]/10"
                      data-testid="mobile-input"
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full h-14 bg-[#0F4C5C] text-white rounded-full text-lg font-medium hover:bg-[#0A333E] hover:scale-[1.02] transition-transform duration-200 shadow-lg shadow-[#0F4C5C]/20"
                  onClick={handleSendOTP}
                  disabled={loading || mobile.length < 10}
                  data-testid="send-otp-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="animate-fade-in-up" data-testid="step-2">
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-2">
                Verify your number
              </h1>
              <p className="text-[#5F6C7B] mb-8">
                Enter the 6-digit code sent to +91 {mobile}
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="otp" className="text-[#0F4C5C] font-medium">
                    OTP Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={otp}
                    onChange={handleOtpChange}
                    maxLength={6}
                    className="mt-2 h-14 text-2xl text-center tracking-[0.3em] rounded-xl border-[#0F4C5C]/20 focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#0F4C5C]/10"
                    data-testid="otp-input"
                  />
                </div>
                
                <Button 
                  className="w-full h-14 bg-[#0F4C5C] text-white rounded-full text-lg font-medium hover:bg-[#0A333E] hover:scale-[1.02] transition-transform duration-200 shadow-lg shadow-[#0F4C5C]/20"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  data-testid="verify-otp-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Name */}
          {step === 3 && (
            <div className="animate-fade-in-up" data-testid="step-3">
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-2">
                What's your name?
              </h1>
              <p className="text-[#5F6C7B] mb-8">
                This helps us personalize your experience
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[#0F4C5C] font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 h-14 text-lg rounded-xl border-[#0F4C5C]/20 focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#0F4C5C]/10"
                    data-testid="name-input"
                  />
                </div>
                
                <Button 
                  className="w-full h-14 bg-[#0F4C5C] text-white rounded-full text-lg font-medium hover:bg-[#0A333E] hover:scale-[1.02] transition-transform duration-200 shadow-lg shadow-[#0F4C5C]/20"
                  onClick={handleSaveName}
                  disabled={loading || !name.trim()}
                  data-testid="save-name-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <div className="animate-fade-in-up" data-testid="step-4">
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-2">
                Activate your subscription
              </h1>
              <p className="text-[#5F6C7B] mb-8">
                One-time payment for 1 year protection
              </p>
              
              <div className="bg-white rounded-2xl p-6 border border-[#0F4C5C]/5 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#5F6C7B]">Subscription Plan</span>
                  <span className="font-heading font-semibold text-[#0F4C5C]">Annual</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#5F6C7B]">Anonymous Calls</span>
                  <span className="font-heading font-semibold text-[#0F4C5C]">20 calls</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[#5F6C7B]">Validity</span>
                  <span className="font-heading font-semibold text-[#0F4C5C]">1 Year</span>
                </div>
                <div className="border-t border-[#F0EFEA] pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#0F4C5C]">Total Amount</span>
                    <span className="font-heading text-2xl font-bold text-[#E36414]">₹100</span>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full h-14 bg-[#E36414] text-white rounded-full text-lg font-medium hover:bg-[#C5530E] hover:scale-[1.02] transition-transform duration-200 shadow-lg shadow-[#E36414]/20"
                onClick={handlePayment}
                disabled={loading}
                data-testid="pay-btn"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay ₹100
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-[#5F6C7B] mt-4">
                Secure payment powered by Razorpay
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}