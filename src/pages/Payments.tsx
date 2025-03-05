
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PaymentMethods from "./PaymentMethods";
import { useNavigate, useLocation } from "react-router-dom";

interface PaymentsProps {
  initialTab?: "methods";
}

const Payments = ({ initialTab = "methods" }: PaymentsProps) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || "methods");
  const navigate = useNavigate();
  const location = useLocation();

  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Payments</h1>
        <p className="text-gray-600">Manage your payment methods for accepting customer payments</p>
      </div>

      <PaymentMethods isEmbedded={true} />
    </div>
  );
};

export default Payments;
