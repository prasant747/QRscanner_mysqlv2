import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QrCode, ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");

  const handleSendOTP = async () => {
    if (mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { mobile_number: mobile });
      toast.success("OTP sent! Use 123456 for testing");
      setOtp(""); // Clear any previous OTP
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
      
      if (response.data.is_existing_user) {
        localStorage.setItem("qrconnect_user", JSON.stringify(response.data.user));
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.info("Account not found. Please register first.");
        navigate("/register");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid OTP");
    }
    setLoading(false);
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
          onClick={() => step > 1 ? setStep(1) : navigate("/")}
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

      {/* Form Content */}
      <div className="flex-1 px-6 py-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          {step === 1 && (
            <div className="animate-fade-in-up" data-testid="login-step-1">
              <h1 className="font-heading text-3xl font-semibold text-[#0F4C5C] mb-2">
                Welcome back
              </h1>
              <p className="text-[#5F6C7B] mb-8">
                Enter your registered mobile number to login
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
                      data-testid="login-mobile-input"
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full h-14 bg-[#0F4C5C] text-white rounded-full text-lg font-medium hover:bg-[#0A333E] hover:scale-[1.02] transition-transform duration-200 shadow-lg shadow-[#0F4C5C]/20"
                  onClick={handleSendOTP}
                  disabled={loading || mobile.length < 10}
                  data-testid="login-send-otp-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
                </Button>
                
                <p className="text-center text-[#5F6C7B] text-sm">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => navigate("/register")}
                    className="text-[#E36414] font-medium hover:underline"
                    data-testid="goto-register-btn"
                  >
                    Register now
                  </button>
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up" data-testid="login-step-2">
              <h1 className="font-heading text-3xl font-semibold text-[#0F4C5C] mb-2">
                Verify OTP
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
                    data-testid="login-otp-input"
                  />
                </div>
                
                <p className="text-sm text-[#5F6C7B] text-center">
                  For testing, use OTP: <span className="font-semibold text-[#E36414]">123456</span>
                </p>
                
                <Button 
                  className="w-full h-14 bg-[#0F4C5C] text-white rounded-full text-lg font-medium hover:bg-[#0A333E] hover:scale-[1.02] transition-transform duration-200 shadow-lg shadow-[#0F4C5C]/20"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  data-testid="login-verify-otp-btn"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
                </Button>
                
                <button 
                  onClick={() => setStep(1)}
                  className="w-full text-center text-[#5F6C7B] text-sm hover:text-[#0F4C5C]"
                >
                  Change mobile number
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
