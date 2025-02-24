
import { Calendar, Users, CreditCard, BarChart } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Easy online booking system that syncs with your calendar instantly"
  },
  {
    icon: Users,
    title: "Client Management",
    description: "Keep track of your clients, their preferences, and booking history"
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Accept payments online and manage your earnings in one place"
  },
  {
    icon: BarChart,
    title: "Business Insights",
    description: "Track your performance and grow your business with detailed analytics"
  }
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">Everything you need to succeed</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Powerful tools to help you manage and grow your service business
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <feature.icon className="w-12 h-12 text-gebeya-pink mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
