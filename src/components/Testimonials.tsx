
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const testimonials = [
  {
    name: "Wairimu",
    role: "Hairstylist",
    quote: "Since I started using Jitume, I no longer spend hours replying to messages. My bookings run smoothly, and my clients love how fast I respond!"
  },
  {
    name: "Kevin",
    role: "Personal Trainer",
    quote: "I used to miss out on new clients because I couldn't check my phone while training. Now, Jitume handles my bookings and reminders, so I never lose a client!"
  },
  {
    name: "Brian",
    role: "Photographer",
    quote: "Jitume has made scheduling so easy. Clients can book me directly without endless back-and-forth messages. Plus, getting paid online has never been simpler!"
  },
  {
    name: "Aisha",
    role: "Makeup Artist",
    quote: "Before Jitume, I'd spend half my day responding to the same questions. Now, my WhatsApp replies are handled automatically, and I can focus on my work!"
  },
  {
    name: "Samuel",
    role: "Padel Tennis Coach",
    quote: "Coaching sessions used to be hard to organize, and I'd lose clients when I couldn't reply in time. Now, Jitume takes care of my scheduling, and I can focus on my training programs!"
  }
];

export const Testimonials = () => {
  const plugin = useRef(
    Autoplay({ delay: 9000, stopOnInteraction: true })
  );

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from service providers who have transformed their business with Jitume
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[plugin.current]}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="border-none shadow-lg">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="relative">
                          <div className="absolute -top-2 -left-2 text-6xl text-gebeya-pink opacity-20">
                            "
                          </div>
                          <p className="text-gray-700 relative z-10 pt-4">
                            {testimonial.quote}
                          </p>
                        </div>
                        <div className="pt-4">
                          <p className="font-semibold text-gebeya-pink">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
