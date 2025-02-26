
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const HowItWorks = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Using more reliable images that are less likely to cause display issues
  const screenshots = [
    "/lovable-uploads/43596b3e-9e4c-4d5a-b25f-6019cc8e2c6c.png",
    "/lovable-uploads/62113946-5bee-4782-a35e-c8bd5788f240.png",
    "/lovable-uploads/8834b56d-b4d5-42a0-9364-175e2674f577.png",
    "/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png",
    "/lovable-uploads/fd307a90-476a-4b92-8bcd-e0bf99ef54e3.png"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === screenshots.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

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
              <div className="w-full aspect-[9/19] bg-black rounded-[3rem] border-[8px] border-gray-800 shadow-xl overflow-hidden relative">
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl z-10"></div>
                
                {/* Screenshots container */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="flex transition-transform duration-500 ease-in-out h-full" 
                       style={{ 
                         transform: `translateX(-${currentImageIndex * 100}%)`,
                         width: `${screenshots.length * 100}%`
                       }}>
                    {screenshots.map((src, index) => (
                      <div 
                        key={src}
                        className="flex-shrink-0"
                        style={{ width: `${100 / screenshots.length}%` }}
                      >
                        <img
                          src={src}
                          alt={`App screenshot ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="eager"
                        />
                      </div>
                    ))}
                  </div>
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
