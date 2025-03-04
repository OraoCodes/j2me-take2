
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { loadScript } from '@/utils/scriptLoader';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

// This is what Telegram returns after successful authentication
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
  const navigate = useNavigate();
  const debugIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Unique value for bot_id to prevent caching issues
  const botId = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'GebeyaJitumeBot';

  // Load the Telegram script
  useEffect(() => {
    const loadTelegramWidget = async () => {
      try {
        await loadScript('https://telegram.org/js/telegram-widget.js?22', 'telegram-login');
        setScriptLoaded(true);
        console.log(`[DEBUG:${debugIdRef.current}] Telegram script loaded successfully`);
      } catch (error) {
        console.error(`[DEBUG:${debugIdRef.current}] Failed to load Telegram widget:`, error);
        setError('Failed to load Telegram login widget. Please try again later.');
      }
    };
    
    loadTelegramWidget();
    
    return () => {
      // Clean up if needed
      const oldScript = document.getElementById('telegram-login');
      if (oldScript) {
        console.log(`[DEBUG:${debugIdRef.current}] Cleaning up old Telegram script`);
      }
    };
  }, []);

  // Initialize Telegram widget once script is loaded
  useEffect(() => {
    if (scriptLoaded && containerRef.current) {
      try {
        // Clear container first
        containerRef.current.innerHTML = '';
        console.log(`[DEBUG:${debugIdRef.current}] Container cleared for Telegram widget`);
        
        // Create a unique callback name to prevent conflicts
        const callbackName = `onTelegramAuth_${Math.random().toString(36).substring(2, 15)}`;
        
        // Add the callback function to window
        window[callbackName] = (user: TelegramUser) => handleTelegramAuth(user);
        
        // Create the script element with configuration
        const script = document.createElement('script');
        script.setAttribute('async', '');
        script.setAttribute('data-telegram-login', botId);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '4');
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-userpic', 'false');
        script.setAttribute('data-onauth', `${callbackName}(user)`);
        
        // Explicitly set the URL to the current origin to avoid redirect issues
        const currentOrigin = window.location.origin;
        const authPath = `/auth?tab=${isSignUp ? 'signup' : 'signin'}`;
        const fullAuthUrl = `${currentOrigin}${authPath}`;
        script.setAttribute('data-auth-url', fullAuthUrl);
        
        console.log(`[DEBUG:${debugIdRef.current}] Setting auth URL to: ${fullAuthUrl}`);
        
        // Append to container
        containerRef.current.appendChild(script);
        console.log(`[DEBUG:${debugIdRef.current}] Telegram widget script appended to container`);
      } catch (err) {
        console.error(`[DEBUG:${debugIdRef.current}] Error initializing Telegram widget:`, err);
        setError('Error initializing Telegram login. Please refresh the page and try again.');
      }
    }
  }, [scriptLoaded, isSignUp, botId]);

  // Handle Telegram authentication result
  const handleTelegramAuth = async (user: TelegramUser) => {
    console.log(`[DEBUG:${debugIdRef.current}] Received Telegram auth:`, user);
    setIsLoading(true);
    
    try {
      // Verify the telegram authentication on the server
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
        // Set telegram auth flow type in localStorage
        const authFlow = isSignUp ? 'signup' : 'signin';
        console.log(`[DEBUG:${debugIdRef.current}] Setting telegram_auth_flow to '${authFlow}'`);
        localStorage.setItem('telegram_auth_flow', authFlow);
        
        // Redirect to the auth link
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
          <div 
            ref={containerRef} 
            className="flex justify-center w-full min-h-[48px]"
            aria-label={scriptLoaded ? "Telegram login button" : "Loading Telegram login button"}
          >
            {/* Telegram widget will be inserted here by script */}
          </div>
          
          {!scriptLoaded && (
            <Button
              disabled
              className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white"
            >
              Loading Telegram login...
            </Button>
          )}
          
          {/* Fallback button in case the widget doesn't load properly */}
          {scriptLoaded && (
            <div className="telegram-login-fallback mt-2" style={{ display: 'none' }}>
              <Button
                className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 text-white"
                onClick={() => {
                  // Show a helpful message if the widget didn't appear
                  toast({
                    title: "Telegram Login",
                    description: "Please ensure you have Telegram installed and try again.",
                  });
                  
                  // After a short delay, try refreshing the widget
                  setTimeout(() => {
                    if (containerRef.current) {
                      containerRef.current.innerHTML = '';
                      setScriptLoaded(false);
                      setTimeout(() => setScriptLoaded(true), 500);
                    }
                  }, 1000);
                }}
              >
                Connect with Telegram
              </Button>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    setTimeout(() => {
                      if (!document.querySelector('iframe[src*="telegram.org"]')) {
                        document.querySelector('.telegram-login-fallback').style.display = 'block';
                      }
                    }, 3000);
                  `
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
