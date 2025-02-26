
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProblemSolution = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <div className="inline-block">
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
                The Challenge
              </div>
            </div>
            <p className="text-2xl md:text-3xl text-gray-900 font-medium leading-relaxed">
              "As a solo service provider, you only make money when you're working. But answering repetitive WhatsApp messages takes time, and missing a message could mean losing a client to a competitor."
            </p>
          </div>

          <div className="space-y-6">
            <div className="inline-block">
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                The Solution
              </div>
            </div>
            <p className="text-2xl md:text-3xl text-gray-900 font-medium leading-relaxed">
              "With Jitume, your WhatsApp messages get answered, bookings are handled, and payments collected—so you never miss a client while you're working."
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => {
              const howItWorksSection = document.getElementById('how-it-works');
              howItWorksSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            variant="outline"
            className="gap-2"
          >
            See How It Works
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
