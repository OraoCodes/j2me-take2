
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Wallet, Banknote } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

interface PaymentMethod {
  id: string;
  name: string;
  icon: JSX.Element;
  enabled: boolean;
}

const PaymentMethods = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "mpesa",
      name: "Mpesa",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <rect width="24" height="24" rx="12" fill="#4CAF50" />
          <path
            d="M7 12h10M12 7v10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
      enabled: false,
    },
    {
      id: "cash",
      name: "Cash on Service Delivery",
      icon: <Banknote className="w-6 h-6 text-gray-700" />,
      enabled: false,
    },
    {
      id: "wallet",
      name: "Wallet",
      icon: <Wallet className="w-6 h-6 text-gray-700" />,
      enabled: false,
    },
  ]);

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method =>
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${step === 2
                    ? "border-gebeya-pink bg-white text-gebeya-pink"
                    : step < 2
                    ? "border-gebeya-pink bg-gebeya-pink text-white"
                    : "border-gray-200 text-gray-400"
                  }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Add your payment methods</h1>
          <p className="text-gray-600 text-lg">
            Customers will choose one of the following payment methods to make payment
          </p>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-3">
                {method.icon}
                <span className="font-medium">{method.name}</span>
              </div>
              <Switch
                checked={method.enabled}
                onCheckedChange={() => togglePaymentMethod(method.id)}
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12">
          <Button
            onClick={() => navigate("/add-products")}
            variant="outline"
            className="w-full h-12 mb-4"
          >
            Skip
          </Button>
          <Button
            onClick={() => {
              // Navigate to next page
            }}
            className="w-full h-12 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
