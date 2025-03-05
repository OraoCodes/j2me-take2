
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PaymentMethods from "./PaymentMethods";
import { useNavigate, useLocation } from "react-router-dom";

interface TransactionsTableProps {
  // Placeholder for future implementation
}

const TransactionsTable = ({}: TransactionsTableProps) => {
  return (
    <div className="rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Transactions</h2>
      <div className="text-gray-500 py-8 text-center">
        <p>No transactions found.</p>
        <p className="mt-2">Transactions will appear here once customers make payments.</p>
      </div>
    </div>
  );
};

interface PaymentsProps {
  initialTab?: "methods" | "transactions";
}

const Payments = ({ initialTab = "methods" }: PaymentsProps) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update the URL when tab changes
    if (value === "methods") {
      navigate("/dashboard/payments/methods");
    } else if (value === "transactions") {
      navigate("/dashboard/payments/transactions");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Payments</h1>
        <p className="text-gray-600">Manage your payment methods and view transaction history</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-2">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="methods" className="mt-6">
          <PaymentMethods isEmbedded={true} />
        </TabsContent>
        
        <TabsContent value="transactions" className="mt-6">
          <TransactionsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payments;
