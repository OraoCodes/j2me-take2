
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Wallet, Banknote } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PaymentMethod {
  id: string;
  name: string;
  icon: JSX.Element;
  enabled: boolean;
}

interface MpesaDetails {
  idType: string;
  phoneNumber: string;
}

interface PaymentMethodRecord {
  user_id: string;
  mpesa_id_type: string | null;
  mpesa_phone: string | null;
  cash_enabled: boolean;
  mpesa_enabled: boolean;
  wallet_enabled: boolean;
}

interface PaymentMethodsProps {
  isEmbedded?: boolean;
}

const PaymentMethods = ({ isEmbedded = false }: PaymentMethodsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [userWhatsappNumber, setUserWhatsappNumber] = useState<string>("");
  const [mpesaDetails, setMpesaDetails] = useState<MpesaDetails>({
    idType: "",
    phoneNumber: "",
  });
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

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        navigate('/auth');
        return;
      }

      // Fetch profile data to get WhatsApp number
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('id', session.session.user.id)
        .single();

      if (profileData && profileData.whatsapp_number) {
        setUserWhatsappNumber(profileData.whatsapp_number);
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPaymentMethods(methods => methods.map(method => ({
          ...method,
          enabled: Boolean(data[`${method.id}_enabled` as keyof PaymentMethodRecord])
        })));

        if (data.mpesa_id_type || data.mpesa_phone) {
          setMpesaDetails({
            idType: data.mpesa_id_type || "",
            phoneNumber: data.mpesa_phone || "",
          });
        }
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment methods.",
      });
    }
  };

  const savePaymentMethods = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        navigate('/auth');
        return;
      }

      const paymentData: PaymentMethodRecord = {
        user_id: session.session.user.id,
        mpesa_id_type: paymentMethods.find(m => m.id === 'mpesa')?.enabled ? mpesaDetails.idType : null,
        mpesa_phone: paymentMethods.find(m => m.id === 'mpesa')?.enabled ? mpesaDetails.phoneNumber : null,
        cash_enabled: paymentMethods.find(m => m.id === 'cash')?.enabled || false,
        mpesa_enabled: paymentMethods.find(m => m.id === 'mpesa')?.enabled || false,
        wallet_enabled: paymentMethods.find(m => m.id === 'wallet')?.enabled || false,
      };

      const { error } = await supabase
        .from('payment_methods')
        .upsert(paymentData)
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment methods saved successfully!",
      });

      if (!isEmbedded) {
        navigate('/social-links');
      }
    } catch (error) {
      console.error('Error saving payment methods:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save payment methods.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(method =>
        method.id === id ? { ...method, enabled: !method.enabled } : method
      )
    );
  };

  const handleIdTypeChange = (value: string) => {
    setMpesaDetails(prev => {
      // If the ID type is "phone" (Send Money), prepopulate with WhatsApp number
      const newPhoneNumber = value === "phone" && userWhatsappNumber ? userWhatsappNumber : prev.phoneNumber;
      return {
        idType: value,
        phoneNumber: newPhoneNumber
      };
    });
  };

  const navigateBack = () => {
    if (isEmbedded) {
      // If embedded, we don't need to navigate
      return;
    }
    navigate('/add-services');
  };

  // Content for the embedded version (in dashboard)
  if (isEmbedded) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
          <p className="text-gray-600 mb-6">
            Configure the payment methods your customers can use when booking your services.
          </p>
          
          {/* Payment Methods */}
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {method.icon}
                    <span className="font-medium">{method.name}</span>
                  </div>
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={() => togglePaymentMethod(method.id)}
                  />
                </div>
                
                {/* Mpesa Details Section */}
                {method.id === "mpesa" && method.enabled && (
                  <div className="border-t border-gray-100 p-4 space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="idType" className="text-sm font-medium flex gap-1">
                        ID type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={mpesaDetails.idType}
                        onValueChange={handleIdTypeChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phone">Send Money</SelectItem>
                          <SelectItem value="tillNumber">Till Number</SelectItem>
                          <SelectItem value="paybill">Paybill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-sm font-medium flex gap-1">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <div className="w-24">
                          <Input
                            value="+254"
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <Input
                          id="phoneNumber"
                          value={mpesaDetails.phoneNumber}
                          onChange={(e) => 
                            setMpesaDetails(prev => ({ ...prev, phoneNumber: e.target.value }))
                          }
                          placeholder="Enter phone number"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={savePaymentMethods}
              disabled={isLoading}
              className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
            >
              {isLoading ? "Saving..." : "Save Payment Methods"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Original standalone page content
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
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {method.icon}
                  <span className="font-medium">{method.name}</span>
                </div>
                <Switch
                  checked={method.enabled}
                  onCheckedChange={() => togglePaymentMethod(method.id)}
                />
              </div>
              
              {/* Mpesa Details Section */}
              {method.id === "mpesa" && method.enabled && (
                <div className="border-t border-gray-100 p-4 space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="idType" className="text-sm font-medium flex gap-1">
                      ID type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={mpesaDetails.idType}
                      onValueChange={handleIdTypeChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Send Money</SelectItem>
                        <SelectItem value="tillNumber">Till Number</SelectItem>
                        <SelectItem value="paybill">Paybill</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium flex gap-1">
                      Phone <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="w-24">
                        <Input
                          value="+254"
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <Input
                        id="phoneNumber"
                        value={mpesaDetails.phoneNumber}
                        onChange={(e) => 
                          setMpesaDetails(prev => ({ ...prev, phoneNumber: e.target.value }))
                        }
                        placeholder="Enter phone number"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex justify-center gap-4">
          <Button
            variant="outline"
            className="w-32"
            onClick={navigateBack}
          >
            Back
          </Button>
          <Button
            variant="outline"
            className="w-32"
            onClick={() => navigate("/social-links")}
          >
            Skip
          </Button>
          <Button
            onClick={savePaymentMethods}
            disabled={isLoading}
            className="w-32 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
          >
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
