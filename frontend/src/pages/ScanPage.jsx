import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Phone, Shield, Lock, AlertCircle, CheckCircle2, Loader2, QrCode } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ScanPage() {
  const { qrCode } = useParams();
  const [status, setStatus] = useState("loading"); // loading, active, inactive, calling, connected
  const [message, setMessage] = useState("");
  const [canCall, setCanCall] = useState(false);
  const [calling, setCalling] = useState(false);

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

  const handleCall = async () => {
    setCalling(true);
    setStatus("calling");
    
    try {
      const response = await axios.post(`${API}/call/initiate`, { qr_code: qrCode });
      
      if (response.data.success) {
        setStatus("connected");
        toast.success("Call connected!");
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
                    onClick={handleCall}
                    disabled={calling}
                    data-testid="call-owner-btn"
                  >
                    {calling ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <Phone className="w-8 h-8" />
                    )}
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

          {/* Calling State */}
          {status === "calling" && (
            <div className="text-center animate-fade-in-up" data-testid="calling-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#E36414]/10 flex items-center justify-center">
                <Phone className="w-12 h-12 text-[#E36414] animate-pulse" />
              </div>
              
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-3">
                Connecting...
              </h1>
              <p className="text-[#5F6C7B]">
                Please wait while we connect your call
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

          {/* Connected State */}
          {status === "connected" && (
            <div className="text-center animate-fade-in-up" data-testid="connected-state">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="font-heading text-2xl font-semibold text-[#0F4C5C] mb-3">
                Call Connected!
              </h1>
              <p className="text-[#5F6C7B] mb-6">
                You are now connected with the owner. Both parties' identities remain protected.
              </p>
              
              <div className="bg-green-50 rounded-xl p-4 text-green-700 text-sm">
                <p className="font-medium">Mock Call Active</p>
                <p className="text-green-600 mt-1">
                  This is a simulation. Real calling will be enabled in production.
                </p>
              </div>
              
              <Button 
                className="mt-6 bg-[#0F4C5C] text-white rounded-full px-8 hover:bg-[#0A333E]"
                onClick={() => setStatus("active")}
                data-testid="call-again-btn"
              >
                Call Again
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
