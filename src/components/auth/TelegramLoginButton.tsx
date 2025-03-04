
import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { TelegramPinVerificationDialog } from './TelegramPinVerificationDialog';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const TelegramLoginButton = ({ isSignUp = false }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showUsernameWarning, setShowUsernameWarning] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState("");
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const navigate = useNavigate();
  const debugIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));

  // Handle Telegram login with PIN
  const handleTelegramLogin = () => {
    if (isLoading) return;
    
    // Reset username warning display
    setShowUsernameWarning(false);
    
    if (!telegramUsername) {
      setShowUsernameWarning(true);
      toast({
        variant: "destructive",
        title: "Telegram Username Required",
        description: "Please enter your Telegram username to continue."
      });
      return;
    }
    
    // Validate username format (no @ prefix)
    const cleanUsername = telegramUsername.startsWith('@') 
      ? telegramUsername.substring(1) 
      : telegramUsername;
    
    if (!/^[a-zA-Z0-9_]{5,32}$/.test(cleanUsername)) {
      setShowUsernameWarning(true);
      toast({
        variant: "destructive",
        title: "Invalid Telegram Username",
        description: "Username must be 5-32 characters and can only contain letters, numbers, and underscores."
      });
      return;
    }
    
    setTelegramUsername(cleanUsername);
    setIsLoading(true);
    
    // Open PIN verification dialog
    setIsPinDialogOpen(true);
  };
  
  // Handle successful PIN verification
  const handlePinVerificationSuccess = (authLink: string) => {
    if (authLink) {
      // Set telegram auth flow type in localStorage
      const authFlow = isSignUp ? 'signup' : 'signin';
      console.log(`[DEBUG:${debugIdRef.current}] Setting telegram_auth_flow to '${authFlow}'`);
      localStorage.setItem('telegram_auth_flow', authFlow);
      
      // Redirect to the auth link
      console.log(`[DEBUG:${debugIdRef.current}] Redirecting to auth link:`, authLink);
      window.location.href = authLink;
    } else {
      console.error(`[DEBUG:${debugIdRef.current}] No auth link received`);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "Could not authenticate with Telegram. Please try again later.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {showUsernameWarning && (
        <Alert className="bg-amber-50 border-amber-200 mb-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Telegram Username Required</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            <p>You must have a username in your Telegram profile settings before you can authenticate.</p>
            <ol className="mt-2 list-decimal list-inside text-xs">
              <li>Open Telegram app</li>
              <li>Go to Settings</li>
              <li>Tap on your profile info</li>
              <li>Set a username</li>
              <li>Return here and try again</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-3">
        <Label htmlFor="telegram-username" className="text-sm">Telegram Username</Label>
        <Input
          id="telegram-username"
          value={telegramUsername}
          onChange={(e) => setTelegramUsername(e.target.value)}
          placeholder="username (without @)"
          className="mt-1"
        />
      </div>
      
      <Button
        onClick={handleTelegramLogin}
        className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white"
        disabled={isLoading}
      >
        {isLoading ? "Authenticating..." : isSignUp ? "Sign up with Telegram" : "Sign in with Telegram"}
      </Button>
      
      <TelegramPinVerificationDialog
        isOpen={isPinDialogOpen}
        onClose={() => {
          setIsPinDialogOpen(false);
          setIsLoading(false);
        }}
        telegramUsername={telegramUsername}
        isSignUp={isSignUp}
        onSuccess={handlePinVerificationSuccess}
      />
    </div>
  );
};
