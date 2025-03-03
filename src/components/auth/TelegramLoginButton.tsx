
import { useEffect, useState, useCallback } from 'react';
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
  const BOT_ID = '7984716005'; // Telegram bot ID
  const navigate = useNavigate();

  // Create a memoized version of handleTelegramAuth to avoid recreating it on each render
  const handleTelegramAuth = useCallback(async (telegramUser: any) => {
    try {
      console.log('Telegram auth callback received user data:', telegramUser);
      
      if (!telegramUser) {
        setIsLoading(false);
        throw new Error('Authentication cancelled or failed');
      }
      
      // Set telegram auth flow type in localStorage
      const authFlow = isSignUp ? 'signup' : 'signin';
      console.log(`Setting telegram_auth_flow to '${authFlow}'`);
      localStorage.setItem('telegram_auth_flow', authFlow);
      
      // Call our Supabase Edge Function
      console.log('Calling telegram-bot function with isSignUp:', isSignUp);
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'auth', 
          telegramUser,
          isSignUp
        }
      });
      
      if (error) {
        console.error('Telegram auth error from function:', error);
        throw error;
      }
      
      console.log('Response from telegram-bot function:', data);
      
      if (data?.authLink) {
        // Verify the auth flow type is still set
        const storedAuthFlow = localStorage.getItem('telegram_auth_flow');
        console.log(`Auth flow is set to: '${storedAuthFlow}' before redirect`);
        
        // Directly redirect to the auth link provided by the edge function
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
        description: err instanceof Error ? err.message : "An error occurred during authentication"
      });
      setIsLoading(false);
    }
  }, [isSignUp, toast, navigate]);

  useEffect(() => {
    // Set the global callback that Telegram will use
    window.onTelegramAuth = handleTelegramAuth;
    
    // Load Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'GebeyaJitumeBot'); 
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    
    // Cleanup previous script if it exists
    const existingScript = document.getElementById('telegram-login-script');
    if (existingScript) {
      existingScript.remove();
    }
    
    script.id = 'telegram-login-script';
    document.body.appendChild(script);
    
    console.log('Telegram login component mounted, isSignUp:', isSignUp);
    console.log('Window onTelegramAuth set:', !!window.onTelegramAuth);

    return () => {
      // Remove script and callback on unmount
      const scriptToRemove = document.getElementById('telegram-login-script');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
      console.log('Cleaning up Telegram login component');
      delete window.onTelegramAuth;
    };
  }, [handleTelegramAuth]);

  const handleTelegramLogin = () => {
    if (!window.Telegram?.Login?.auth) {
      console.error('Telegram Login SDK not loaded');
      toast({
        variant: "destructive",
        title: "Telegram widget not loaded",
        description: "Please try again later or refresh the page",
      });
      return;
    }
    
    setIsLoading(true);
    console.log('Initiating Telegram auth flow, isSignUp:', isSignUp);
    
    try {
      window.Telegram.Login.auth(
        {
          bot_id: BOT_ID,
          request_access: true,
          callback: (user) => {
            console.log('Direct Telegram callback with user:', user ? 'User data received' : 'No user data');
            handleTelegramAuth(user);
          },
        }
      );
    } catch (error) {
      console.error('Error initiating Telegram auth:', error);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "Failed to start Telegram authentication",
      });
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
