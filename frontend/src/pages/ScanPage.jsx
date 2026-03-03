import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, Shield, Lock, AlertCircle, CheckCircle2, Loader2, QrCode } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ScanPage() {
  const { qrCode } = useParams();
  const [status, setStatus] = useState("loading"); // loading, active, inactive, enterPhone, calling, connected
  const [message, setMessage] = useState("");
  const [canCall, setCanCall] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callerNumber, setCallerNumber] = useState("");
  const [proxyNumber, setProxyNumber] = useState("");

  useEffect(() => {
    checkQRStatus();
  }, [qrCode]);

  const checkQRStatus = async () => {
    try {
      const response = await axios.get(`${API}/scan/${qrCode}`);
      setStatus(response.data.status === "active" ? "active" : "inactive");
      setMessage(response.data.message);
      setCanCall(response.data.can_call);
    } catch (error) {
      setStatus("inactive");
      setMessage("Unable to verify this QR code. Please try again.");
      setCanCall(false);
    }
  };

  const handleCallClick = () => {
    setStatus("enterPhone");
  };

  const handleCall = async () => {
    if (callerNumber.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setCalling(true);
    setStatus("calling");
    
    try {
      const response = await axios.post(`${API}/call/initiate`, { 
        qr_code: qrCode,
        caller_number: callerNumber
      });
      
      if (response.data.success) {
        setProxyNumber(response.data.proxy_number);
        setStatus("connected");
        toast.success("Call session created!");
      } else {
        setStatus("active");
        toast.error("Call failed. Please try again.");
      }
    } catch (error) {
      setStatus("active");
      toast.error(error.response?.data?.detail || "Call failed");
    }
    
    setCalling(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col" data-testid="scan-page">
      {/* Minimal Header */}
      <header className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#0F4C5C] flex items-center justify-center">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-semibold text-[#0F4C5C]">QRConnect</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Loading State */}
          {status === "loading" && (
            <div className="text-center animate-fade-in-up" data-testid="loading-state">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#0F4C5C]/5 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#0F4C5C] animate-spin" />
              </div>
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-2">
                Verifying QR Code...
              </h1>
              <p className="text-[#5F6C7B]">Please wait a moment</p>
            </div>
          )}

          {/* Active QR - Can Call */}
          {status === "active" && canCall && (
            <div className="text-center animate-fade-in-up" data-testid="active-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#0F4C5C]/5 flex items-center justify-center">
                <Shield className="w-12 h-12 text-[#0F4C5C]" />
              </div>
              
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-3">
                QRConnect Verified
              </h1>
              <p className="text-[#5F6C7B] mb-8 leading-relaxed">
                {message}
              </p>
              
              {/* Call Button */}
              <div className="relative inline-block mb-8">
                <div className="call-button-pulse">
                  <Button 
                    className="w-20 h-20 rounded-full bg-[#E36414] text-white hover:bg-[#C5530E] shadow-xl"
                    onClick={handleCallClick}
                    disabled={calling}
                    data-testid="call-owner-btn"
                  >
                    <Phone className="w-8 h-8" />
                  </Button>
                </div>
              </div>
              
              <p className="text-lg font-medium text-[#0F4C5C] mb-2">
                Tap to Call Owner
              </p>
              <p className="text-sm text-[#5F6C7B]">
                Your identity will remain anonymous
              </p>
              
              {/* Trust Badges */}
              <div className="mt-10 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-[#5F6C7B] text-sm">
                  <Lock className="w-4 h-4" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2 text-[#5F6C7B] text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Anonymous</span>
                </div>
              </div>
            </div>
          )}

          {/* Enter Phone Number State */}
          {status === "enterPhone" && (
            <div className="text-center animate-fade-in-up" data-testid="enter-phone-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#0F4C5C]/5 flex items-center justify-center">
                <Phone className="w-12 h-12 text-[#0F4C5C]" />
              </div>
              
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-3">
                Enter Your Number
              </h1>
              <p className="text-[#5F6C7B] mb-6 leading-relaxed">
                We'll give you a number to call. Your real number stays hidden.
              </p>
              
              <div className="text-left mb-6">
                <Label htmlFor="callerNumber" className="text-[#0F4C5C] font-medium">
                  Your Mobile Number
                </Label>
                <div className="mt-2 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6C7B]">
                    +91
                  </span>
                  <Input
                    id="callerNumber"
                    type="tel"
                    placeholder="9876543210"
                    value={callerNumber}
                    onChange={(e) => setCallerNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-14 h-14 text-lg rounded-xl border-[#0F4C5C]/20 focus:border-[#0F4C5C] focus:ring-2 focus:ring-[#0F4C5C]/10"
                    data-testid="caller-number-input"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full h-14 bg-[#E36414] text-white rounded-full text-lg font-medium hover:bg-[#C5530E] shadow-lg"
                onClick={handleCall}
                disabled={calling || callerNumber.length < 10}
                data-testid="initiate-call-btn"
              >
                {calling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Get Anonymous Number"}
              </Button>
              
              <button 
                className="mt-4 text-[#5F6C7B] text-sm hover:text-[#0F4C5C]"
                onClick={() => setStatus("active")}
              >
                ← Go Back
              </button>
              
              <div className="mt-6 bg-[#F0EFEA] rounded-xl p-4 text-sm text-[#5F6C7B]">
                <Lock className="w-4 h-4 inline mr-2" />
                Your number is only used to create the anonymous connection. Neither party sees the other's real number.
              </div>
            </div>
          )}

          {/* Calling State */}
          {status === "calling" && (
            <div className="text-center animate-fade-in-up" data-testid="calling-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#E36414]/10 flex items-center justify-center">
                <Phone className="w-12 h-12 text-[#E36414] animate-pulse" />
              </div>
              
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-3">
                Setting Up...
              </h1>
              <p className="text-[#5F6C7B]">
                Creating your anonymous connection
              </p>
              
              <div className="mt-8 flex justify-center">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#E36414] animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-3 h-3 rounded-full bg-[#E36414] animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-3 h-3 rounded-full bg-[#E36414] animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Connected State - Show Proxy Number */}
          {status === "connected" && (
            <div className="text-center animate-fade-in-up" data-testid="connected-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-3">
                Ready to Call!
              </h1>
              <p className="text-[#5F6C7B] mb-6">
                Call this number to connect anonymously with the owner:
              </p>
              
              <div className="bg-[#0F4C5C] rounded-2xl p-6 mb-6">
                <p className="text-white/70 text-sm mb-2">Dial this number:</p>
                <a 
                  href={`tel:${proxyNumber}`}
                  className="text-white text-3xl font-bold tracking-wider hover:text-[#E36414] transition-colors"
                  data-testid="proxy-number"
                >
                  {proxyNumber}
                </a>
              </div>
              
              <Button 
                className="w-full h-14 bg-[#E36414] text-white rounded-full text-lg font-medium hover:bg-[#C5530E] shadow-lg mb-4"
                onClick={() => window.location.href = `tel:${proxyNumber}`}
                data-testid="dial-btn"
              >
                <Phone className="w-5 h-5 mr-2" />
                Tap to Dial
              </Button>
              
              <div className="bg-green-50 rounded-xl p-4 text-green-700 text-sm">
                <Shield className="w-4 h-4 inline mr-2" />
                Both parties' real numbers are hidden. The session expires after the call.
              </div>
              
              <Button 
                variant="outline"
                className="mt-4 rounded-full px-6"
                onClick={() => {
                  setStatus("active");
                  setCallerNumber("");
                  setProxyNumber("");
                }}
                data-testid="new-call-btn"
              >
                Start New Call
              </Button>
            </div>
          )}

          {/* Inactive QR */}
          {status === "inactive" && (
            <div className="text-center animate-fade-in-up" data-testid="inactive-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#E36414]/10 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-[#E36414]" />
              </div>
              
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-3">
                QR Not Active
              </h1>
              <p className="text-[#5F6C7B] mb-6 leading-relaxed">
                {message}
              </p>
              
              <div className="bg-[#F0EFEA] rounded-xl p-4 text-[#5F6C7B] text-sm">
                <p>
                  The owner of this QR code needs to activate their subscription to receive calls.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-sm text-[#5F6C7B]">
          Powered by <span className="font-medium text-[#0F4C5C]">QRConnect</span> - Privacy-First Contact
        </p>
      </footer>
      
      {/* Hide Emergent Badge */}
      <style>{`
        [data-emergent-badge], 
        [class*="emergent"], 
        iframe[src*="emergent"],
        div[style*="Made with Emergent"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
}