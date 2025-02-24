
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Diamond, Briefcase } from "lucide-react";

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <img 
        src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" 
        alt="Gebeya" 
        className="h-12 mb-8 animate-fade-up" 
      />
      
      <div className="w-full max-w-5xl space-y-8 animate-fade-up [animation-delay:200ms]">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Choose your plan
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 px-4">
          {/* Premium Plan */}
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Diamond className="h-6 w-6 text-blue-500" />
              <h3 className="text-2xl font-bold">Premium</h3>
            </div>
            <p className="text-muted-foreground">For professionals</p>
            <ul className="space-y-4">
              <li>Everything in Basic</li>
              <li>Unlimited images</li>
              <li>Custom domain and email</li>
              <li>Card payments (Stripe and more)</li>
              <li>Payment proof and processing fee</li>
              <li>Analytics, SEO and Meta Pixel</li>
              <li>Invoice settings and PDF</li>
              <li>CSV import/export</li>
              <li>Delivery distance calculation</li>
              <li>Customer reviews</li>
              <li>Live chat support</li>
            </ul>
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600 mt-6"
              onClick={() => navigate("/dashboard")}
            >
              Start at $1
            </Button>
          </div>

          {/* Business Plan */}
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-6 w-6 text-purple-500" />
              <h3 className="text-2xl font-bold">Business</h3>
            </div>
            <p className="text-muted-foreground">For teams</p>
            <ul className="space-y-4">
              <li>Everything in Premium</li>
              <li>5 stores and 5 staff</li>
              <li>Take App branding removal</li>
              <li>WhatsApp Workflow and Catalog</li>
              <li>Shared Team WhatsApp Inbox</li>
              <li>Membership rewards</li>
              <li>Membership exclusive access</li>
              <li>Wholesale pricing</li>
              <li>3rd-party apps integration</li>
              <li>Webhooks and API</li>
              <li>Dedicated account support</li>
            </ul>
            <Button 
              className="w-full bg-purple-500 hover:bg-purple-600 mt-6"
              onClick={() => navigate("/dashboard")}
            >
              Start at $9
            </Button>
          </div>
        </div>

        <div className="text-center pt-8">
          <Button 
            variant="link" 
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-primary"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
