
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Diamond, Briefcase } from "lucide-react";
import { Header } from "@/components/Header";

const PricingPage = () => {
  const navigate = useNavigate();

  const handleChoosePlan = (planName: string, price: number, period: "monthly" | "yearly") => {
    if (planName === "Free") {
      navigate("/service-share");
    } else {
      navigate("/payment", { 
        state: { 
          planDetails: {
            name: planName,
            price: price,
            period: period
          }
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="pt-24 flex flex-col items-center justify-center p-4">
        {/* Progress Steps */}
        <div className="flex items-center gap-3 mb-12">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                ${step === 5
                  ? "border-gebeya-pink bg-white text-gebeya-pink"
                  : step < 5
                  ? "border-gebeya-pink bg-gebeya-pink text-white"
                  : "border-gray-200 text-gray-400"
                }`}
            >
              {step < 5 ? (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step
              )}
            </div>
          ))}
        </div>
        
        <div className="w-full max-w-7xl space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Choose Your Plan
            </h2>
            <p className="text-muted-foreground">
              Select a plan that fits your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 px-4">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="h-6 w-6 text-emerald-500" />
                <h3 className="text-2xl font-bold">Free</h3>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold">KES 0<span className="text-base font-normal text-muted-foreground"> forever</span></p>
                <p className="text-muted-foreground">For Beginners</p>
              </div>
              <ul className="space-y-4">
                <li>✅ WhatsApp Booking Form</li>
                <li>✅ Manual Payment Methods (MPesa, Cash, Bank Transfer)</li>
                <li>✅ Up to 20 Service Listings</li>
                <li>✅ Basic Analytics (Views & Clicks)</li>
              </ul>
              <Button 
                className="w-full bg-emerald-500 hover:bg-emerald-600 mt-6"
                onClick={() => handleChoosePlan("Free", 0, "monthly")}
              >
                Get Started Free
              </Button>
            </div>

            {/* Starter Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg space-y-6 border-2 border-gebeya-pink relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gebeya-pink text-white px-4 py-1 rounded-full text-sm">Most Popular</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Diamond className="h-6 w-6 text-gebeya-pink" />
                <h3 className="text-2xl font-bold">Starter</h3>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monthly</p>
                  <p className="text-3xl font-bold">KES 1,500<span className="text-base font-normal text-muted-foreground">/month</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Yearly</p>
                  <p className="text-3xl font-bold">KES 15,000<span className="text-base font-normal text-muted-foreground">/year</span></p>
                  <p className="text-sm text-green-600">Save 20% + Free Custom Domain 🎁</p>
                </div>
              </div>
              <ul className="space-y-4">
                <li className="font-medium">Everything in Free, plus:</li>
                <li>✅ Unlimited Service Listings</li>
                <li>✅ Custom Domain & Branding</li>
                <li>✅ Online Payments (MPesa, Card, PayPal)</li>
                <li>✅ Automated Booking System</li>
                <li>✅ Customer Reviews & Testimonials</li>
                <li>✅ SEO Optimization & Google Indexing</li>
                <li>✅ PDF Invoices & Receipts</li>
              </ul>
              <div className="space-y-3 mt-6">
                <Button 
                  className="w-full bg-gebeya-pink hover:bg-pink-600"
                  onClick={() => handleChoosePlan("Starter", 1500, "monthly")}
                >
                  Choose Monthly
                </Button>
                <Button 
                  className="w-full bg-gebeya-pink hover:bg-pink-600"
                  onClick={() => handleChoosePlan("Starter", 15000, "yearly")}
                >
                  Choose Yearly
                </Button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-6 w-6 text-gebeya-orange" />
                <h3 className="text-2xl font-bold">Pro</h3>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Monthly</p>
                  <p className="text-3xl font-bold">KES 5,000<span className="text-base font-normal text-muted-foreground">/month</span></p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Yearly</p>
                  <p className="text-3xl font-bold">KES 50,000<span className="text-base font-normal text-muted-foreground">/year</span></p>
                  <p className="text-sm text-green-600">Save 25% + Free Custom Domain 🎁</p>
                </div>
                <p className="text-muted-foreground">For Businesses & Agencies</p>
              </div>
              <ul className="space-y-4">
                <li className="font-medium">Everything in Starter, plus:</li>
                <li>✅ WhatsApp AI Chatbot for Auto-Responses & Bookings</li>
                <li>✅ Loyalty & Subscription-Based Services</li>
                <li>✅ Team Access (Multiple Staff Accounts)</li>
                <li>✅ Integration with Third-Party Apps (CRM, Zapier)</li>
                <li>✅ Advanced Analytics & Insights</li>
                <li>✅ Priority Customer Support</li>
                <li>✅ Live Chat Support</li>
              </ul>
              <div className="space-y-3 mt-6">
                <Button 
                  className="w-full bg-gebeya-orange hover:bg-orange-600"
                  onClick={() => handleChoosePlan("Pro", 5000, "monthly")}
                >
                  Choose Monthly
                </Button>
                <Button 
                  className="w-full bg-gebeya-orange hover:bg-orange-600"
                  onClick={() => handleChoosePlan("Pro", 50000, "yearly")}
                >
                  Choose Yearly
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
