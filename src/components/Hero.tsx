
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative pt-20">
      <div className="container mx-auto px-4 py-16 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Empower Your Service Business with SoloServe
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            The ultimate platform for freelancers and service providers to showcase, manage, and grow their business online.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-gebeya-pink hover:bg-gebeya-pink/90"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/pricing")}
            >
              View Pricing
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <img 
            src="/lovable-uploads/fd307a90-476a-4b92-8bcd-e0bf99ef54e3.png"
            alt="Service Provider using SoloServe"
            className="rounded-2xl shadow-xl w-full max-w-[600px] mx-auto"
          />
        </div>
      </div>
    </div>
  );
};
