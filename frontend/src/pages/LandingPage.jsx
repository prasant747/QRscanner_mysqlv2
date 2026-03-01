import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Phone, QrCode, Lock, Car, Backpack, Wallet } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Complete Privacy",
      description: "Neither party's phone number is revealed during calls. Your identity stays protected."
    },
    {
      icon: <Phone className="w-8 h-8" />,
      title: "Instant Contact",
      description: "Anyone can scan your QR and call you immediately. No app installation required."
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Secure & Simple",
      description: "Generate your unique QR code once. Print it. Stick it anywhere. You're protected."
    }
  ];

  const useCases = [
    {
      icon: <Backpack className="w-6 h-6" />,
      title: "School Kids",
      description: "Attach to school bags. If your child is lost, anyone can contact you."
    },
    {
      icon: <Car className="w-6 h-6" />,
      title: "Vehicles",
      description: "Stick on your car. Get notified about parking issues or emergencies."
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Valuables",
      description: "Put on wallets, keys, luggage. Lost items can find their way back."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F7F2] noise-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[#0F4C5C] flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-xl text-[#0F4C5C]">QRConnect</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-[#0F4C5C] hover:bg-[#0F4C5C]/5"
              onClick={() => navigate("/login")}
              data-testid="login-nav-btn"
            >
              Login
            </Button>
            <Button 
              className="bg-[#0F4C5C] text-white rounded-full px-6 hover:bg-[#0A333E] hover:scale-105 transition-transform duration-200"
              onClick={() => navigate("/register")}
              data-testid="register-nav-btn"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 hero-pattern">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F4C5C]/5 text-[#0F4C5C] text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                <span>Privacy-First Contact Solution</span>
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#0F4C5C] leading-tight mb-6">
                Anonymous Calling for{" "}
                <span className="text-[#E36414]">Safety & Peace of Mind</span>
              </h1>
              <p className="text-lg text-[#5F6C7B] mb-8 max-w-xl leading-relaxed">
                Generate a unique QR code. Stick it on your kid's bag, car, or wallet. 
                If found, anyone can call you without seeing your number.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-[#E36414] text-white rounded-full px-8 py-6 text-lg font-medium hover:bg-[#C5530E] hover:scale-105 transition-transform duration-200 shadow-lg shadow-[#E36414]/20"
                  onClick={() => navigate("/register")}
                  data-testid="hero-cta-btn"
                >
                  Create Your QR — ₹100/year
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full px-8 py-6 text-lg border-[#0F4C5C]/20 text-[#0F4C5C] hover:bg-[#0F4C5C]/5"
                  onClick={() => navigate("/login")}
                  data-testid="hero-login-btn"
                >
                  Already Registered?
                </Button>
              </div>
            </div>
            <div className="md:col-span-5 animate-fade-in-up animate-delay-200">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#0F4C5C]/10 to-[#E36414]/10 rounded-3xl blur-2xl"></div>
                <img 
                  src="https://images.unsplash.com/photo-1767082091146-c6691c772875?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwzfHxoYXBweSUyMG1vdGhlciUyMGFuZCUyMGNoaWxkJTIwaW4lMjBwYXJrfGVufDB8fHx8MTc3MjAxNjQxN3ww&ixlib=rb-4.1.0&q=85"
                  alt="Parent and child safety"
                  className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#E36414] font-medium tracking-widest text-xs uppercase mb-3">How It Works</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-[#0F4C5C]">
              Simple. Secure. Anonymous.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`feature-card-${index}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0F4C5C]/5 flex items-center justify-center text-[#0F4C5C] mb-5">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#0F4C5C] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#5F6C7B] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#E36414] font-medium tracking-widest text-xs uppercase mb-3">Use Cases</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-[#0F4C5C]">
              Protect What Matters Most
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-8 border border-[#0F4C5C]/5 hover:shadow-lg transition-shadow duration-300"
                data-testid={`usecase-card-${index}`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#E36414]/10 flex items-center justify-center text-[#E36414] mb-4">
                  {useCase.icon}
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#0F4C5C] mb-2">
                  {useCase.title}
                </h3>
                <p className="text-[#5F6C7B] text-sm leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-[#0F4C5C]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#E36414] font-medium tracking-widest text-xs uppercase mb-3">Pricing</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-white mb-6">
            One Simple Plan. Complete Protection.
          </h2>
          <div className="bg-white rounded-3xl p-8 md:p-12 mt-10 shadow-2xl">
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="font-heading text-5xl font-bold text-[#0F4C5C]">₹100</span>
              <span className="text-[#5F6C7B]">/year</span>
            </div>
            <p className="text-[#5F6C7B] mb-8">Includes 20 anonymous calls</p>
            <ul className="text-left max-w-sm mx-auto space-y-4 mb-10">
              <li className="flex items-center gap-3 text-[#0F4C5C]">
                <div className="w-5 h-5 rounded-full bg-[#E36414]/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#E36414]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Unique QR code generation</span>
              </li>
              <li className="flex items-center gap-3 text-[#0F4C5C]">
                <div className="w-5 h-5 rounded-full bg-[#E36414]/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#E36414]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>20 anonymous calls included</span>
              </li>
              <li className="flex items-center gap-3 text-[#0F4C5C]">
                <div className="w-5 h-5 rounded-full bg-[#E36414]/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#E36414]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Complete identity protection</span>
              </li>
              <li className="flex items-center gap-3 text-[#0F4C5C]">
                <div className="w-5 h-5 rounded-full bg-[#E36414]/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#E36414]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Print unlimited QR copies</span>
              </li>
            </ul>
            <Button 
              className="bg-[#E36414] text-white rounded-full px-10 py-6 text-lg font-medium hover:bg-[#C5530E] hover:scale-105 transition-transform duration-200 shadow-lg shadow-[#E36414]/30"
              onClick={() => navigate("/register")}
              data-testid="pricing-cta-btn"
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-[#0F4C5C] border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-semibold text-white">QRConnect</span>
          </div>
          <p className="text-white/60 text-sm">
            © 2026 QRConnect. Privacy-first contact solution.
          </p>
        </div>
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
