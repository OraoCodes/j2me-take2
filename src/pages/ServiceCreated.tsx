
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

const ServiceCreated = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 pt-32 flex flex-col items-center justify-center text-center">
        <img 
          src="/lovable-uploads/62113946-5bee-4782-a35e-c8bd5788f240.png" 
          alt="Success" 
          className="w-32 h-32 mb-8"
        />
        <h1 className="text-5xl font-bold mb-4">
          🎉 Your Service Page is Live!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Start customizing your page to attract more clients.
        </p>
        <Button
          onClick={() => navigate('/dashboard')}
          className="w-full max-w-md h-14 text-lg bg-gray-900 hover:bg-gray-800 text-white"
        >
          Start Customizing
        </Button>
      </div>
    </div>
  );
};

export default ServiceCreated;
