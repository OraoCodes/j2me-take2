import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { loadScript } from '@/utils/scriptLoader';
import { AlertCircle, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export const TelegramLoginButton = ({ isSignUp = false }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetInitialized, setWidgetInitialized] = useState(false);
  const navigate = useNavigate();
  const debugIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [widgetAttempts, setWidgetAttempts] = useState(0);
  const [useFallbackButton, setUseFallbackButton] = useState(false);

  // Use the specific bot ID you mentioned
  const botId = "IrenePABot";

  useEffect(() => {
    const loadTelegramWidget = async () => {
      try {
        await loadScript('https://telegram.org/js/telegram-widget.js?22', 'telegram-login');
        setScriptLoaded(true);
        console.log(`[DEBUG:${debugIdRef.current}] Telegram script loaded successfully`);
      } catch (error) {
        console.error(`[DEBUG:${debugIdRef.current}] Failed to load Telegram widget:`, error);
        setError('Failed to load Telegram login widget. Please try again later.');
        setUseFallbackButton(true);
      }
    };
    
    loadTelegramWidget();
    
    return () => {
      const oldScript = document.getElementById('telegram-login');
      if (oldScript) {
        console.log(`[DEBUG:${debugIdRef.current}] Cleaning up old Telegram script`);
      }
    };
  }, []);

  useEffect(() => {
    if (scriptLoaded && containerRef.current && widgetAttempts < 3 && !useFallbackButton) {
      try {
        // Clear any previous content
        containerRef.current.innerHTML = '';
        console.log(`[DEBUG:${debugIdRef.current}] Container cleared for Telegram widget`);
        
        // Create a unique callback name for this instance
        const callbackName = `onTelegramAuth_${Math.random().toString(36).substring(2, 15)}`;
        
        // Define the callback function in the global scope
        window[callbackName] = (user: TelegramUser) => handleTelegramAuth(user);
        
        // Create the script element for the Telegram widget
        const script = document.createElement('script');
        script.setAttribute('async', '');
        script.setAttribute('data-telegram-login', botId);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '4');
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-userpic', 'false');
        script.setAttribute('data-onauth', `${callbackName}(user)`);
        
        // Using a Button URL approach instead of auth-url to avoid redirects
        // This will keep users in the app and use our callback
        script.removeAttribute('data-auth-url');
        
        console.log(`[DEBUG:${debugIdRef.current}] Creating widget with bot ID: ${botId}`);
        
        // Append the script to the container
        containerRef.current.appendChild(script);
        console.log(`[DEBUG:${debugIdRef.current}] Telegram widget script appended to container`);
        
        // Check if widget initialized after a reasonable timeout
        setTimeout(() => {
          const iframe = containerRef.current?.querySelector('iframe');
          if (containerRef.current && !iframe) {
            console.log(`[DEBUG:${debugIdRef.current}] Telegram widget failed to initialize after attempt ${widgetAttempts + 1}`);
            console.log(`[DEBUG:${debugIdRef.current}] Container HTML: ${containerRef.current.innerHTML}`);
            
            if (widgetAttempts >= 2) {
              console.log(`[DEBUG:${debugIdRef.current}] Max attempts reached, switching to fallback button`);
              setUseFallbackButton(true);
              toast({
                title: "Telegram Login",
                description: "Widget couldn't be loaded. Using alternative method.",
              });
            } else {
              setWidgetAttempts(prev => prev + 1);
            }
          } else {
            console.log(`[DEBUG:${debugIdRef.current}] Telegram widget initialized successfully. Iframe found:`, !!iframe);
            setWidgetInitialized(true);
          }
        }, 2000);
      } catch (err) {
        console.error(`[DEBUG:${debugIdRef.current}] Error initializing Telegram widget:`, err);
        setError('Error initializing Telegram login. Please refresh the page and try again.');
        setUseFallbackButton(true);
      }
    }
  }, [scriptLoaded, isSignUp, botId, widgetAttempts, useFallbackButton, toast]);

  const handleTelegramAuth = async (user: TelegramUser) => {
    console.log(`[DEBUG:${debugIdRef.current}] Received Telegram auth:`, user);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'process-telegram-auth', 
          telegramUser: user,
          isSignUp,
          origin: window.location.origin
        }
      });
      
      if (error) {
        console.error(`[DEBUG:${debugIdRef.current}] Error processing Telegram auth:`, error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error.message || "Failed to authenticate with Telegram"
        });
        setIsLoading(false);
        return;
      }
      
      console.log(`[DEBUG:${debugIdRef.current}] Telegram auth response:`, data);
      
      if (data?.authLink) {
        const authFlow = isSignUp ? 'signup' : 'signin';
        console.log(`[DEBUG:${debugIdRef.current}] Setting telegram_auth_flow to '${authFlow}'`);
        localStorage.setItem('telegram_auth_flow', authFlow);
        
        console.log(`[DEBUG:${debugIdRef.current}] Redirecting to auth link:`, data.authLink);
        window.location.href = data.authLink;
      } else if (data?.error) {
        setError(data.error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: data.error
        });
        setIsLoading(false);
      } else {
        setError("An unexpected error occurred. Please try again.");
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication"
        });
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(`[DEBUG:${debugIdRef.current}] Unexpected error in Telegram auth:`, err);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: err?.message || "An unexpected error occurred"
      });
      setIsLoading(false);
    }
  };

  const handleFallbackClick = () => {
    // Creating a PIN verification flow instead of direct app redirect
    setError(null);
    toast({
      title: "Telegram Login",
      description: "Please provide your Telegram username to receive a verification PIN.",
    });
    
    // Open a dialog to collect the username and verify PIN
    // This dialog is defined in TelegramPinVerificationDialog.tsx
    const event = new CustomEvent('open-telegram-pin-dialog', { 
      detail: { isSignUp } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-2 w-full">
      {error && (
        <Alert className="bg-amber-50 border-amber-200 mb-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Authentication Error</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <Button
          disabled
          className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white"
        >
          Authenticating with Telegram...
        </Button>
      ) : (
        <div className="w-full">
          {!useFallbackButton && (
            <div 
              ref={containerRef} 
              className="flex justify-center w-full min-h-[48px]"
              aria-label={scriptLoaded ? "Telegram login button" : "Loading Telegram login button"}
            >
              {/* Telegram widget will be inserted here by script */}
            </div>
          )}
          
          {(useFallbackButton || !scriptLoaded || widgetAttempts >= 2 || !widgetInitialized) && (
            <Button
              className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white mt-2"
              onClick={handleFallbackClick}
              disabled={isLoading}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {isSignUp ? "Sign up with Telegram" : "Sign in with Telegram"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
