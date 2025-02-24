
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-pink-50 to-white pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="text-left lg:w-1/2 max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight animate-fade-up" style={{ lineHeight: 1.1 }}>
              Empower Your Service Business with <span className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">SoloServe</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 animate-fade-up [animation-delay:200ms]">
              The ultimate platform for freelancers and service providers to showcase, manage, and grow their business online.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-start animate-fade-up [animation-delay:400ms]">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white min-w-[200px]"
                onClick={() => navigate("/auth?tab=signup")}
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="min-w-[200px]"
                onClick={() => navigate("/pricing")}
              >
                View Demo
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2 animate-fade-up [animation-delay:600ms]">
            <img
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
              alt="Service Professional using SoloServe platform"
              className="w-full h-auto rounded-2xl shadow-2xl"
              style={{
                maxWidth: "600px",
                transform: "perspective(1000px) rotateY(-5deg) rotateX(5deg)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
