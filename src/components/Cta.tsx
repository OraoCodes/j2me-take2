
import { Button } from "./ui/button";

export const Cta = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-gebeya-pink to-gebeya-orange">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to grow your service business?
          </h2>
          <p className="text-xl opacity-90 mb-10">
            Join thousands of service providers who trust Gebeya to manage and grow their business
          </p>
          <Button size="lg" variant="secondary" className="bg-white text-gebeya-pink hover:bg-gray-100">
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
};
