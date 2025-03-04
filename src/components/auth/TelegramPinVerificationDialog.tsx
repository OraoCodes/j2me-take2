
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TelegramPinVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  telegramUsername: string;
  isSignUp: boolean;
  onSuccess: (authLink: string) => void;
}

export const TelegramPinVerificationDialog = ({
  isOpen,
  onClose,
  telegramUsername,
  isSignUp,
  onSuccess
}: TelegramPinVerificationDialogProps) => {
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const debugId = Math.random().toString(36).substring(2, 15);
  
  // Handle countdown for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && resendDisabled) {
      setResendDisabled(false);
    }
  }, [countdown, resendDisabled]);

  // Handle sending PIN request
  const handleSendPin = async () => {
    if (!telegramUsername) {
      setError("Telegram username is required");
      return;
    }
    
    setError(null);
    setIsVerifying(true);
    
    try {
      console.log(`[DEBUG:${debugId}] Requesting PIN for Telegram username: ${telegramUsername}`);
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'request-pin', 
          telegramUsername,
          isSignUp,
          origin: window.location.origin
        }
      });
      
      if (error) {
        console.error(`[DEBUG:${debugId}] Error requesting PIN:`, error);
        setError(error.message || "Failed to send PIN. Please try again.");
        setIsVerifying(false);
        return;
      }
      
      console.log(`[DEBUG:${debugId}] PIN request response:`, data);
      
      if (data?.success) {
        toast({
          title: "PIN Sent",
          description: "A verification PIN has been sent to your Telegram account. Please enter it below.",
        });
        
        // Disable resend button for 60 seconds
        setResendDisabled(true);
        setCountdown(60);
      } else if (data?.error) {
        setError(data.error);
      } else {
        setError("Failed to send PIN. Please make sure your Telegram username is correct.");
      }
    } catch (err) {
      console.error(`[DEBUG:${debugId}] Unexpected error requesting PIN:`, err);
      setError("An unexpected error occurred. Please try again.");
    }
    
    setIsVerifying(false);
  };

  // Handle PIN verification
  const handleVerifyPin = async () => {
    if (!pin) {
      setError("Please enter the PIN sent to your Telegram account");
      return;
    }
    
    setError(null);
    setIsVerifying(true);
    
    try {
      console.log(`[DEBUG:${debugId}] Verifying PIN for Telegram username: ${telegramUsername}`);
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'verify-pin', 
          telegramUsername,
          pin,
          isSignUp,
          origin: window.location.origin
        }
      });
      
      if (error) {
        console.error(`[DEBUG:${debugId}] Error verifying PIN:`, error);
        setError(error.message || "Failed to verify PIN. Please try again.");
        setIsVerifying(false);
        return;
      }
      
      console.log(`[DEBUG:${debugId}] PIN verification response:`, data);
      
      if (data?.authLink) {
        toast({
          title: "Verification Successful",
          description: "Your Telegram account has been verified.",
        });
        
        // Notify parent component of success
        onSuccess(data.authLink);
        onClose();
      } else if (data?.error) {
        setError(data.error);
      } else {
        setError("Invalid PIN. Please try again.");
      }
    } catch (err) {
      console.error(`[DEBUG:${debugId}] Unexpected error verifying PIN:`, err);
      setError("An unexpected error occurred. Please try again.");
    }
    
    setIsVerifying(false);
  };
  
  // Send PIN when dialog is opened
  useEffect(() => {
    if (isOpen && telegramUsername) {
      handleSendPin();
    }
  }, [isOpen, telegramUsername]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Telegram Verification</DialogTitle>
          <DialogDescription>
            Enter the PIN code sent to your Telegram account
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="telegram-username">Telegram Username</Label>
            <Input 
              id="telegram-username" 
              value={telegramUsername} 
              disabled 
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="telegram-pin">Verification PIN</Label>
            <Input 
              id="telegram-pin" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter the PIN from Telegram"
              maxLength={6}
            />
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={handleVerifyPin} 
              className="w-full"
              disabled={isVerifying || !pin}
            >
              {isVerifying ? "Verifying..." : "Verify PIN"}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleSendPin} 
              className="w-full"
              disabled={isVerifying || resendDisabled}
            >
              {resendDisabled 
                ? `Resend PIN (${countdown}s)` 
                : "Resend PIN"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
