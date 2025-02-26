
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const HowItWorks = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const screenshots = [
    "/lovable-uploads/f9c08c20-f560-4d51-9bdf-09698f2cccbb.png",
    "/lovable-uploads/fa30d6d9-3bb2-44e4-a64e-46866385e54d.png",
    "/lovable-uploads/9a363348-92ce-47d3-99ef-b41a2f84566d.png",
    "/lovable-uploads/614005bc-5234-40d2-bbe6-7aeb52420dd2.png",
    "/lovable-uploads/a785d519-b6a9-49d1-8011-01bc8c6693c2.png"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === screenshots.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

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
              <div className="w-full aspect-[9/19] bg-black rounded-[3rem] border-[8px] border-gray-800 shadow-xl overflow-hidden">
                {screenshots.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt={`App screenshot ${index + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                      currentImageIndex === index ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
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
