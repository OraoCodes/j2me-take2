
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";

interface PlanDetails {
  name: string;
  price: number;
  period: "monthly" | "yearly";
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [processingStripe, setProcessingStripe] = useState(false);
  
  // Get plan details from location state
  const planDetails: PlanDetails = location.state?.planDetails || {
    name: "Unknown Plan",
    price: 0,
    period: "monthly"
  };

  // Check if returning from Stripe with success
  useEffect(() => {
    const checkStripeSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      const paymentSuccess = searchParams.get('payment_success');
      
      if (sessionId && paymentSuccess === 'true') {
        setProcessingStripe(true);
        
        try {
          // Call the edge function to handle the successful payment
          const { data: user } = await supabase.auth.getUser();
          
          if (!user?.user) {
            throw new Error('User not authenticated');
          }
          
          const { data, error } = await supabase.functions.invoke('handle-stripe-success', {
            body: { sessionId }
          });
          
          if (error) throw error;
          
          setShowSuccessDialog(true);
        } catch (error) {
          console.error('Error processing Stripe success:', error);
          toast({
            variant: "destructive",
            title: "Payment Error",
            description: "There was a problem finalizing your payment. Please contact support.",
          });
        } finally {
          setProcessingStripe(false);
        }
      }
    };
    
    checkStripeSuccess();
  }, [searchParams]);

  const handleStripePayment = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      // Get user's email and name if available
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, company_name')
        .eq('id', user.id)
        .single();
      
      // Call the Stripe payment edge function
      const { data, error } = await supabase.functions.invoke('create-stripe-payment', {
        body: {
          planName: planDetails.name,
          planPrice: planDetails.price,
          planPeriod: planDetails.period,
          userId: user.id,
          customerEmail: user.email || profile?.email,
          customerName: profile?.company_name
        }
      });
      
      if (error) throw error;
      
      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "There was a problem setting up the payment. Please try again.",
      });
      setIsLoading(false);
    }
  };
  
  const navigateToDashboard = () => {
    navigate('/dashboard');
  };

  if (processingStripe) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-24 max-w-xl flex flex-col items-center justify-center">
          <Spinner className="w-10 h-10 text-gebeya-pink" />
          <p className="mt-4 text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

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
          <div className="space-y-6">
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <h3 className="font-medium mb-2">Payment Information</h3>
              <p>• You'll be redirected to Stripe's secure payment page</p>
              <p>• All payment details are processed securely by Stripe</p>
              <p>• Your subscription will be activated immediately after successful payment</p>
            </div>
            
            <Button 
              onClick={handleStripePayment}
              className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : `Pay with Stripe - KES ${planDetails.price.toLocaleString()}`}
            </Button>
          </div>
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
