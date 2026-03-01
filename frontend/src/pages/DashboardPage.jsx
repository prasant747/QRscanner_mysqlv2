import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { QrCode, Phone, Calendar, LogOut, Download, Copy, RefreshCw, Shield, Loader2 } from "lucide-react";
import axios from "axios";
import QRCode from "qrcode";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const APP_URL = window.location.origin;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("qrconnect_user");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    const userData = JSON.parse(storedUser);
    fetchDashboard(userData.mobile_number);
  }, [navigate]);

  const fetchDashboard = async (mobile) => {
    try {
      const response = await axios.get(`${API}/user/dashboard/${mobile}`);
      setUser(response.data);
      localStorage.setItem("qrconnect_user", JSON.stringify(response.data));
      generateQRCode(response.data.qr_code);
    } catch (error) {
      toast.error("Failed to load dashboard");
      navigate("/login");
    }
    setLoading(false);
  };

  const generateQRCode = async (qrCode) => {
    try {
      const scanUrl = `${APP_URL}/scan/${qrCode}`;
      const dataUrl = await QRCode.toDataURL(scanUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0F4C5C",
          light: "#FFFFFF"
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("QR generation failed:", error);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrDataUrl || !user) return;
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const qrSize = 300;
    const padding = 40;
    const totalWidth = qrSize + padding * 2;
    const totalHeight = qrSize + padding * 2 + 60;
    
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, qrSize, qrSize);
      
      ctx.fillStyle = "#0F4C5C";
      ctx.font = "bold 16px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Scan to contact owner", totalWidth / 2, qrSize + padding + 30);
      
      ctx.font = "12px 'DM Sans', sans-serif";
      ctx.fillStyle = "#5F6C7B";
      ctx.fillText("QRConnect - Anonymous Contact", totalWidth / 2, qrSize + padding + 50);
      
      const link = document.createElement("a");
      link.download = `QRConnect-${user.qr_code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("QR code downloaded!");
    };
    img.src = qrDataUrl;
  };

  const handleCopyLink = () => {
    if (!user) return;
    const scanUrl = `${APP_URL}/scan/${user.qr_code}`;
    navigator.clipboard.writeText(scanUrl);
    toast.success("Link copied to clipboard!");
  };

  const handleLogout = () => {
    localStorage.removeItem("qrconnect_user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleRecharge = async () => {
    setRechargeLoading(true);
    try {
      const response = await axios.post(`${API}/payment/process`, {
        mobile_number: user.mobile_number,
        amount: 100
      });
      setUser(response.data.user);
      localStorage.setItem("qrconnect_user", JSON.stringify(response.data.user));
      toast.success("Payment successful! Subscription renewed.");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Payment failed");
    }
    setRechargeLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#0F4C5C] animate-spin" />
          <p className="text-[#5F6C7B]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2]" data-testid="dashboard-page">
      {/* Header */}
      <header className="bg-white border-b border-[#0F4C5C]/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#0F4C5C] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-xl text-[#0F4C5C]">QRConnect</span>
          </div>
          <Button 
            variant="ghost" 
            className="text-[#5F6C7B] hover:text-[#0F4C5C] hover:bg-[#0F4C5C]/5"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-[#0F4C5C]">
            Welcome, {user?.name || "User"}!
          </h1>
          <p className="text-[#5F6C7B] mt-1">
            Manage your QR code and subscription here
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* QR Code Card */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-[#0F4C5C]/5 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-[#0F4C5C] mb-6">
              Your QR Code
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* QR Display */}
              <div className="qr-container animate-float">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="Your QR Code" 
                    className="w-48 h-48"
                    data-testid="qr-code-image"
                  />
                ) : (
                  <div className="w-48 h-48 bg-[#F0EFEA] rounded-xl flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-[#5F6C7B]" />
                  </div>
                )}
              </div>
              
              {/* QR Info & Actions */}
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F4C5C]/5 text-sm text-[#0F4C5C] mb-4">
                  <Shield className="w-4 h-4" />
                  <span>Anonymous Contact Enabled</span>
                </div>
                
                <p className="text-[#5F6C7B] mb-6">
                  Print this QR code and attach it to your belongings. Anyone who scans it can contact you without seeing your number.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    className="bg-[#E36414] text-white rounded-full px-6 hover:bg-[#C5530E] hover:scale-105 transition-transform duration-200 shadow-lg shadow-[#E36414]/20"
                    onClick={handleDownloadQR}
                    data-testid="download-qr-btn"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR
                  </Button>
                  <Button 
                    variant="outline"
                    className="rounded-full px-6 border-[#0F4C5C]/20 text-[#0F4C5C] hover:bg-[#0F4C5C]/5"
                    onClick={handleCopyLink}
                    data-testid="copy-link-btn"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4">
            {/* Subscription Status */}
            <div className={`stats-card ${user?.subscription_status === "active" ? "border-l-4 border-l-green-500" : "border-l-4 border-l-[#E36414]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#5F6C7B] text-sm">Subscription</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user?.subscription_status === "active" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-[#E36414]/10 text-[#E36414]"
                }`}>
                  {user?.subscription_status?.toUpperCase() || "PENDING"}
                </span>
              </div>
              <p className="font-heading text-2xl font-bold text-[#0F4C5C]" data-testid="subscription-status">
                {user?.subscription_status === "active" ? "Active" : "Inactive"}
              </p>
              {user?.subscription_status !== "active" && (
                <Button 
                  className="mt-3 w-full bg-[#E36414] text-white rounded-full text-sm hover:bg-[#C5530E]"
                  onClick={handleRecharge}
                  disabled={rechargeLoading}
                  data-testid="recharge-btn"
                >
                  {rechargeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recharge ₹100"}
                </Button>
              )}
            </div>

            {/* Remaining Calls */}
            <div className="stats-card">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-[#5F6C7B]" />
                <span className="text-[#5F6C7B] text-sm">Remaining Calls</span>
              </div>
              <p className="font-heading text-3xl font-bold text-[#0F4C5C]" data-testid="remaining-calls">
                {user?.remaining_calls || 0}
                <span className="text-lg text-[#5F6C7B] font-normal"> / 20</span>
              </p>
              {user?.remaining_calls <= 0 && user?.subscription_status === "active" && (
                <Button 
                  className="mt-3 w-full bg-[#E36414] text-white rounded-full text-sm hover:bg-[#C5530E]"
                  onClick={handleRecharge}
                  disabled={rechargeLoading}
                  data-testid="renew-btn"
                >
                  {rechargeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Renew ₹100 (Get 20 Calls)"}
                </Button>
              )}
            </div>

            {/* Expiry Date */}
            <div className="stats-card">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#5F6C7B]" />
                <span className="text-[#5F6C7B] text-sm">Valid Until</span>
              </div>
              <p className="font-heading text-xl font-bold text-[#0F4C5C]" data-testid="expiry-date">
                {formatDate(user?.subscription_expiry_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-2xl p-6 border border-[#0F4C5C]/5">
          <h3 className="font-heading text-lg font-semibold text-[#0F4C5C] mb-4">
            How to use your QR Code
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E36414]/10 flex items-center justify-center text-[#E36414] font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-[#0F4C5C]">Download & Print</p>
                <p className="text-sm text-[#5F6C7B]">Download your QR and print it in any size</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E36414]/10 flex items-center justify-center text-[#E36414] font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-[#0F4C5C]">Stick Anywhere</p>
                <p className="text-sm text-[#5F6C7B]">Attach to bags, cars, wallets, or any valuables</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#E36414]/10 flex items-center justify-center text-[#E36414] font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-[#0F4C5C]">Stay Protected</p>
                <p className="text-sm text-[#5F6C7B]">Anyone can scan & call you anonymously</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}