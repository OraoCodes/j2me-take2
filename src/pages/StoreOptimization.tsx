import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Calendar, MessageSquareMore, Gift, Globe, CreditCard, Mail } from "lucide-react";

interface OptimizationOption {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  enabled: boolean;
  plan?: "BUSINESS" | "PREMIUM";
}

const StoreOptimization = () => {
  const navigate = useNavigate();
  const [options, setOptions] = useState<OptimizationOption[]>([
    {
      id: "instantBooking",
      name: "Enable Instant Booking",
      description: "Clients can book your services automatically without manual confirmation.",
      icon: <Calendar className="w-6 h-6" />,
      enabled: false,
    },
    {
      id: "whatsappBot",
      name: "WhatsApp Auto-Responses",
      description: "Automate replies & confirmations for client inquiries.",
      icon: <MessageSquareMore className="w-6 h-6" />,
      enabled: false,
      plan: "BUSINESS",
    },
    {
      id: "loyalty",
      name: "Client Loyalty & Rewards",
      description: "Offer discounts & exclusive deals for repeat clients.",
      icon: <Gift className="w-6 h-6" />,
      enabled: false,
      plan: "BUSINESS",
    },
    {
      id: "customDomain",
      name: "Custom Domain & Branding",
      description: "Use your own domain & remove platform branding.",
      icon: <Globe className="w-6 h-6" />,
      enabled: false,
      plan: "PREMIUM",
    },
    {
      id: "onlinePayments",
      name: "Accept Online Payments",
      description: "Enable MPesa, Card, PayPal, and other payment options.",
      icon: <CreditCard className="w-6 h-6" />,
      enabled: false,
      plan: "PREMIUM",
    },
    {
      id: "reminders",
      name: "Send SMS & Email Reminders",
      description: "Automatically remind clients of upcoming appointments.",
      icon: <Mail className="w-6 h-6" />,
      enabled: false,
    },
  ]);

  const toggleOption = (id: string) => {
    setOptions(opts =>
      opts.map(opt =>
        opt.id === id ? { ...opt, enabled: !opt.enabled } : opt
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${step === 4
                    ? "border-gebeya-pink bg-white text-gebeya-pink"
                    : step < 4
                    ? "border-gebeya-pink bg-gebeya-pink text-white"
                    : "border-gray-200 text-gray-400"
                  }`}
              >
                {step < 4 ? (
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Optimize Your Service Page & Enhance Your Branding
          </h1>
          <p className="text-gray-600 text-lg">
            Customize your service page with advanced features
          </p>
        </div>

        {/* Optimization Options */}
        <div className="space-y-4">
          {options.map((option) => (
            <div
              key={option.id}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    {option.icon}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.name}</span>
                      {option.plan && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          option.plan === "BUSINESS" 
                            ? "bg-[#E6F0FF] text-[#3B82F6]" 
                            : "bg-[#F0E6FF] text-[#9333EA]"
                        }`}>
                          {option.plan}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 ml-9">{option.description}</p>
                </div>
                <Switch
                  checked={option.enabled}
                  onCheckedChange={() => toggleOption(option.id)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12">
          <Button
            onClick={() => navigate("/pricing")}
            className="w-full h-12 bg-[#2A2A2A] hover:opacity-90 text-white"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreOptimization;
