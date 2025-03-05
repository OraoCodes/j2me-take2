
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PlanDetails {
  name: string;
  price: number;
  period: "monthly" | "yearly";
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [paymentTab, setPaymentTab] = useState("card");
  
  // Form state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    name: "",
  });
  
  const [mpesaDetails, setMpesaDetails] = useState({
    phoneNumber: "",
  });

  // Get plan details from location state
  const planDetails: PlanDetails = location.state?.planDetails || {
    name: "Unknown Plan",
    price: 0,
    period: "monthly"
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real implementation, you would process payment through Stripe or another provider
      // This is just a simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After successful payment, update user subscription in database
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: session.session.user.id,
            plan: planDetails.name.toLowerCase(),
            period: planDetails.period,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(new Date().setFullYear(
              planDetails.period === 'yearly' ? new Date().getFullYear() + 1 : new Date().getFullYear(), 
              planDetails.period === 'monthly' ? new Date().getMonth() + 1 : new Date().getMonth()
            )).toISOString(),
          });
          
        if (error) throw error;
      }
      
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "There was a problem processing your payment.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real implementation, you would integrate with MPesa API
      // This is just a simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // After successful payment, update user subscription in database
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: session.session.user.id,
            plan: planDetails.name.toLowerCase(),
            period: planDetails.period,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: new Date(new Date().setFullYear(
              planDetails.period === 'yearly' ? new Date().getFullYear() + 1 : new Date().getFullYear(), 
              planDetails.period === 'monthly' ? new Date().getMonth() + 1 : new Date().getMonth()
            )).toISOString(),
          });
          
        if (error) throw error;
      }
      
      setShowSuccessDialog(true);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "There was a problem processing your payment.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
          <p className="text-gray-600">
            {planDetails.name} Plan - {planDetails.period === "monthly" ? "Monthly" : "Yearly"}
          </p>
          <p className="text-2xl font-bold mt-4">
            KES {planDetails.price.toLocaleString()}{" "}
            <span className="text-sm font-normal text-gray-500">
              /{planDetails.period === "monthly" ? "month" : "year"}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <Tabs value={paymentTab} onValueChange={setPaymentTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="card">Card Payment</TabsTrigger>
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
            </TabsList>
            
            <TabsContent value="card">
              <form onSubmit={handleCardPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input 
                    id="cardName"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input 
                    id="cardNumber"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({...cardDetails, cardNumber: e.target.value})}
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input 
                      id="expiryDate"
                      value={cardDetails.expiryDate}
                      onChange={(e) => setCardDetails({...cardDetails, expiryDate: e.target.value})}
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input 
                      id="cvv"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                      placeholder="123"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : `Pay KES ${planDetails.price.toLocaleString()}`}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="mpesa">
              <form onSubmit={handleMpesaPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mpesaPhone">M-Pesa Phone Number</Label>
                  <div className="flex">
                    <div className="w-24">
                      <Input value="+254" disabled className="bg-gray-50" />
                    </div>
                    <Input 
                      id="mpesaPhone"
                      className="flex-1"
                      value={mpesaDetails.phoneNumber}
                      onChange={(e) => setMpesaDetails({...mpesaDetails, phoneNumber: e.target.value})}
                      placeholder="712345678"
                      required
                    />
                  </div>
                </div>
                
                <div className="rounded-lg bg-gray-50 p-4 text-sm">
                  <p>1. Click "Request Payment" below</p>
                  <p>2. You will receive a prompt on your phone</p>
                  <p>3. Enter your M-Pesa PIN to complete payment</p>
                </div>
                
                <Button 
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : `Request Payment of KES ${planDetails.price.toLocaleString()}`}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        
        <Button 
          variant="outline"
          className="w-full"
          onClick={() => navigate('/pricing')}
        >
          Cancel
        </Button>
      </div>
      
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Successful!</DialogTitle>
            <DialogDescription>
              Thank you for subscribing to our {planDetails.name} plan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <p className="mb-4">Your subscription is now active.</p>
            <Button 
              className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
              onClick={navigateToDashboard}
            >
              Go to Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentPage;
