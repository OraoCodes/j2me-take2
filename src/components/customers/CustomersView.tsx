
import { useState, useEffect } from "react";
import { Info, Loader2, Search, ArrowUpDown, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface Customer {
  phone_number: string;
  name: string;
  email: string | null;
  last_request_date: string;
}

const CustomersView = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('last_request_date', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch customers",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone_number.includes(searchQuery) ||
    (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gebeya-pink" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gebeya-pink">Customers</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gebeya-pink" />
              </TooltipTrigger>
              <TooltipContent>
                <p>View and manage your customer information</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by name, phone, or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md focus:ring-gebeya-pink focus:border-gebeya-pink"
              />
            </div>
            <Button variant="outline" size="icon" className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10">
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer.phone_number}
                className="p-4 flex items-center hover:bg-gray-50/80"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{customer.name}</h3>
                  <div className="text-sm text-gray-500">
                    <p>Phone: {customer.phone_number}</p>
                    {customer.email && <p>Email: {customer.email}</p>}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Last request: {format(new Date(customer.last_request_date), "PPP")}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? "No customers match your search" : "No customers yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomersView;
