
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        auth: (options: {
          bot_id: string;
          request_access?: boolean;
          lang?: string;
          callback: (user: any) => void;
        }) => void;
      }
    }
    onTelegramAuth: (user: any) => void;
  }
}

export const TelegramLoginButton = ({ isSignUp = false }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const BOT_ID = '7984716005'; // Updated Telegram bot ID
  const navigate = useNavigate();

  useEffect(() => {
    // Load Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'GebeyaJitumeBot'); // Your bot username
    script.setAttribute('data-size', 'large');
    
    // Don't set data-auth-url to avoid domain validation issues
    // Instead, we'll use the JavaScript SDK approach
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    
    // Cleanup previous script if it exists
    const existingScript = document.getElementById('telegram-login-script');
    if (existingScript) {
      existingScript.remove();
    }
    
    script.id = 'telegram-login-script';
    document.body.appendChild(script);

    // Create global callback function that Telegram will call
    window.onTelegramAuth = handleTelegramAuth;
    
    console.log('Telegram login component mounted, isSignUp:', isSignUp);

    return () => {
      // Remove script on unmount
      const scriptToRemove = document.getElementById('telegram-login-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
      delete window.onTelegramAuth;
    };
  }, []);

  const handleTelegramLogin = () => {
    if (window.Telegram?.Login?.auth) {
      setIsLoading(true);
      console.log('Initiating Telegram auth flow, isSignUp:', isSignUp);
      window.Telegram.Login.auth(
        {
          bot_id: BOT_ID,
          request_access: true,
          callback: handleTelegramAuth,
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Telegram widget not loaded",
        description: "Please try again later",
      });
    }
  };

  const handleTelegramAuth = async (telegramUser: any) => {
    try {
      setIsLoading(true);
      console.log('Telegram user data received:', telegramUser);
      
      if (!telegramUser) {
        throw new Error('Authentication cancelled or failed');
      }
      
      // Call our Supabase Edge Function
      console.log('Calling telegram-bot function with isSignUp:', isSignUp);
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'auth', 
          telegramUser,
          isSignUp // Pass the isSignUp flag to the function
        }
      });
      
      if (error) {
        console.error('Telegram auth error from function:', error);
        throw error;
      }
      
      console.log('Response from telegram-bot function:', data);
      
      if (data.authLink) {
        // Store the action type before navigating
        const isNewUser = data.action === 'signup' || isSignUp;
        const authFlow = isNewUser ? 'signup' : 'signin';
        console.log(`Setting telegram_auth_flow to '${authFlow}'`);
        localStorage.setItem('telegram_auth_flow', authFlow);
        
        // Redirect to the auth link
        console.log('Redirecting to auth link:', data.authLink);
        window.location.href = data.authLink;
      } else {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Could not authenticate with Telegram",
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Telegram auth error:', err);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: "An error occurred during authentication"
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTelegramLogin}
      className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white"
      disabled={isLoading}
    >
      {isLoading ? "Authenticating..." : isSignUp ? "Sign up with Telegram" : "Sign in with Telegram"}
    </Button>
  );
};
