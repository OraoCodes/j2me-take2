
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Diamond, Briefcase, Star } from "lucide-react";

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <img 
        src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" 
        alt="Gebeya" 
        className="h-12 mb-8 animate-fade-up" 
      />
      
      <div className="w-full max-w-7xl space-y-8 animate-fade-up [animation-delay:200ms]">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Choose your plan
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 px-4">
          {/* Basic/Free Plan */}
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-yellow-500" />
              <h3 className="text-2xl font-bold">Basic</h3>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">$0<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-muted-foreground">Perfect for solo service providers</p>
            </div>
            <ul className="space-y-4">
              <li>✅ Branded service page</li>
              <li>✅ Basic booking system</li>
              <li>✅ Payment links (MPesa, PayPal)</li>
              <li>✅ Social media sharing</li>
              <li>✅ Customer inquiries via WhatsApp</li>
              <li>✅ Basic analytics</li>
              <li>✅ Small transaction fee per booking</li>
            </ul>
            <Button 
              className="w-full bg-yellow-500 hover:bg-yellow-600 mt-6"
              onClick={() => navigate("/dashboard")}
            >
              Start for Free
            </Button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6 border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">Most Popular</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Diamond className="h-6 w-6 text-blue-500" />
              <h3 className="text-2xl font-bold">Pro</h3>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">$9<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-muted-foreground">For growing professionals</p>
            </div>
            <ul className="space-y-4">
              <li>✅ Everything in Basic</li>
              <li>✅ Custom domain & branded email</li>
              <li>✅ Automated booking system</li>
              <li>✅ Card payments integration</li>
              <li>✅ Customer reviews section</li>
              <li>✅ Service bundles & packages</li>
              <li>✅ Basic SEO & Google indexing</li>
              <li>✅ Invoices & automated receipts</li>
              <li>✅ 0% transaction fee</li>
            </ul>
            <Button 
              className="w-full bg-blue-500 hover:bg-blue-600 mt-6"
              onClick={() => navigate("/dashboard")}
            >
              Start Pro Trial
            </Button>
          </div>

          {/* Business Plan */}
          <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-6 w-6 text-purple-500" />
              <h3 className="text-2xl font-bold">Business</h3>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">$29<span className="text-base font-normal text-muted-foreground">/month</span></p>
              <p className="text-muted-foreground">For advanced users</p>
            </div>
            <ul className="space-y-4">
              <li>✅ Everything in Pro</li>
              <li>✅ WhatsApp chatbot</li>
              <li>✅ Automated follow-ups</li>
              <li>✅ Memberships & subscriptions</li>
              <li>✅ Advanced analytics</li>
              <li>✅ API & webhooks</li>
              <li>✅ Priority support</li>
              <li>✅ Dedicated account manager</li>
            </ul>
            <Button 
              className="w-full bg-purple-500 hover:bg-purple-600 mt-6"
              onClick={() => navigate("/dashboard")}
            >
              Start Business Trial
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
