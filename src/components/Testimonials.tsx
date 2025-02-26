
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
    <section className="py-24 bg-gradient-to-br from-gebeya-pink/5 to-gebeya-orange/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            What Our Users Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
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
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 p-2">
                  <div className="bg-white rounded-2xl shadow-xl p-8 h-full transform transition-transform duration-300 hover:scale-105">
                    <div className="space-y-6">
                      <div className="relative">
                        <svg
                          className="absolute -top-4 -left-4 h-8 w-8 text-gebeya-pink opacity-20"
                          fill="currentColor"
                          viewBox="0 0 32 32"
                        >
                          <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                        </svg>
                        <p className="text-gray-700 relative z-10 text-lg leading-relaxed">
                          {testimonial.quote}
                        </p>
                      </div>
                      <div>
                        <p className="text-xl font-semibold bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
                          {testimonial.name}
                        </p>
                        <p className="text-gray-500 font-medium">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 h-12 w-12 border-2 border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink hover:text-white" />
            <CarouselNext className="hidden md:flex -right-12 h-12 w-12 border-2 border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink hover:text-white" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
