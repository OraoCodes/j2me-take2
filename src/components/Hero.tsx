import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export const Hero = () => {
  const navigate = useNavigate();
  const plugin = useRef(
    Autoplay({ delay: 9000, stopOnInteraction: true })
  );

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-pink-50 to-white pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="text-left lg:w-1/2 max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight animate-fade-up text-gebeya-purple" style={{ lineHeight: 1.1 }}>
              Built on the shoulders of giants – and a little AI magic{' '}
              <span className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">~ Martin</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 animate-fade-up [animation-delay:200ms]">
              Hey Martin, tested most of the details—you're gonna be shocked. Nothing breaks, I have full access to your Supabase and agents locally. I can create features, implement, and test before pushing to prod. Might just have M-Pesa payments live before morning… but I guess we'll never know.
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
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[plugin.current]}
              className="w-full"
            >
              <CarouselContent>
                <CarouselItem>
                  <div className="w-full rounded-2xl shadow-2xl overflow-hidden relative">
                    <img
                      src="/lovable-uploads/43596b3e-9e4c-4d5a-b25f-6019cc8e2c6c.png"
                      alt="Service Professional managing their business"
                      className="w-full h-auto"
                      style={{
                        transform: "perspective(1000px) rotateY(-5deg) rotateX(5deg)",
                      }}
                    />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                        <p className="text-white text-lg font-medium">
                          Kevin uses Jitume to send automated reminders and follow-ups to his clients.
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="w-full rounded-2xl shadow-2xl overflow-hidden relative">
                    <img
                      src="/lovable-uploads/03acda6a-09af-4789-985c-0642df7b4b14.png"
                      alt="Professional using Jitume app"
                      className="w-full h-auto"
                      style={{
                        transform: "perspective(1000px) rotateY(-5deg) rotateX(5deg)",
                      }}
                    />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                        <p className="text-white text-lg font-medium">
                          Brian uses Jitume to schedule shoots and receive secure online payments from clients.
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="w-full rounded-2xl shadow-2xl overflow-hidden relative">
                    <img
                      src="/lovable-uploads/8834b56d-b4d5-42a0-9364-175e2674f577.png"
                      alt="Service provider interacting with customer"
                      className="w-full h-auto"
                      style={{
                        transform: "perspective(1000px) rotateY(-5deg) rotateX(5deg)",
                      }}
                    />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                        <p className="text-white text-lg font-medium">
                          Wairimu uses Jitume to organize appointments and keep her clients coming back.
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );
};
