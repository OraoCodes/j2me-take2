
import { Button } from "./ui/button";

export const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-pink-50 to-white pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight animate-fade-up" style={{ lineHeight: 1.1 }}>
            Grow your service business <span className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">effortlessly</span>
          </h1>
          <p className="mt-6 text-xl text-gray-600 animate-fade-up [animation-delay:200ms]">
            The all-in-one platform for independent service providers. Schedule appointments, manage clients, and grow your business.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-up [animation-delay:400ms]">
            <Button size="lg" className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white min-w-[200px]">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="min-w-[200px]">
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
