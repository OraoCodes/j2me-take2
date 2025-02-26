
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-gradient-to-b from-white to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get your service business online in minutes with these simple steps
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
                <p className="text-gray-600">
                  Sign up and create your professional profile in minutes. Add your services, pricing, and availability.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Share Your Link</h3>
                <p className="text-gray-600">
                  Share your unique booking link with clients through WhatsApp, social media, or email.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Bookings</h3>
                <p className="text-gray-600">
                  Clients can easily book and pay for your services online. Manage all bookings from one dashboard.
                </p>
              </div>
            </div>

            <Button 
              size="lg"
              className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white"
              onClick={() => navigate("/auth?tab=signup")}
            >
              Get Started Now
            </Button>
          </div>
          
          <div className="relative">
            <div className="relative mx-auto max-w-[300px]">
              {/* This is a placeholder - you'll replace this with the actual mockup */}
              <div className="w-full aspect-[9/19] bg-gray-100 rounded-[3rem] border-[8px] border-gray-800 shadow-xl overflow-hidden">
                <div className="w-full h-full bg-white">
                  <p className="text-center text-gray-400 mt-8">
                    Placeholder for phone mockup
                  </p>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -z-10 -top-4 -right-4 w-full h-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange rounded-[3rem] opacity-20"></div>
              <div className="absolute -z-10 -bottom-4 -left-4 w-full h-full bg-gradient-to-r from-gebeya-orange to-gebeya-pink rounded-[3rem] opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
