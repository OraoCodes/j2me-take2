
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useEffect } from "react";

const ServiceCreated = () => {
  const navigate = useNavigate();

  // Automatically redirect after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard', { state: { showServices: true } });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center relative z-10">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
          🎉 Your Service Page is Live!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Redirecting you to your services...
        </p>
        <Button 
          onClick={() => navigate('/dashboard', { state: { showServices: true } })} 
          className="w-full max-w-md h-14 text-lg text-white bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
        >
          View All Services
        </Button>
      </div>
    </div>
  );
};

export default ServiceCreated;
