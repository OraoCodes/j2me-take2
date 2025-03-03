
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const WhatsAppLoginButton = ({ isSignUp = false }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid phone number",
        description: "Please enter a valid phone number"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // For now, we'll use email OTP with the phone number as the email
      // In a real implementation, you would integrate with WhatsApp Business API
      const formattedEmail = `whatsapp-${phoneNumber}@gebeya-jitume.app`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email: formattedEmail,
        options: {
          // This would redirect to onboarding for new users
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Link sent",
        description: "Check your email for the login link. In a real implementation, this would be sent via WhatsApp."
      });
      
      setIsOpen(false);
    } catch (err) {
      console.error('WhatsApp auth error:', err);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: err instanceof Error ? err.message : "An error occurred during authentication"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white"
          onClick={() => setIsOpen(true)}
        >
          {isSignUp ? "Sign up with WhatsApp" : "Sign in with WhatsApp"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter your WhatsApp number</DialogTitle>
        </DialogHeader>
        <form onSubmit={handlePhoneSubmit} className="space-y-4 pt-4">
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+254 700 000 000"
            required
          />
          <Button 
            type="submit" 
            className="w-full bg-[#25D366] hover:bg-[#25D366]/90"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : isSignUp ? "Continue with WhatsApp" : "Continue with WhatsApp"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
