
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

  const botId = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'GebeyaJitumeBot';

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
        containerRef.current.innerHTML = '';
        console.log(`[DEBUG:${debugIdRef.current}] Container cleared for Telegram widget`);
        
        const callbackName = `onTelegramAuth_${Math.random().toString(36).substring(2, 15)}`;
        
        window[callbackName] = (user: TelegramUser) => handleTelegramAuth(user);
        
        const script = document.createElement('script');
        script.setAttribute('async', '');
        script.setAttribute('data-telegram-login', botId);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '4');
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-userpic', 'false');
        script.setAttribute('data-onauth', `${callbackName}(user)`);
        
        const currentOrigin = window.location.origin;
        const authPath = `/auth?tab=${isSignUp ? 'signup' : 'signin'}`;
        const fullAuthUrl = `${currentOrigin}${authPath}`;
        script.setAttribute('data-auth-url', fullAuthUrl);
        
        console.log(`[DEBUG:${debugIdRef.current}] Setting auth URL to: ${fullAuthUrl}`);
        
        containerRef.current.appendChild(script);
        console.log(`[DEBUG:${debugIdRef.current}] Telegram widget script appended to container`);
        
        // Check if widget initialized after a reasonable timeout
        setTimeout(() => {
          if (containerRef.current && !containerRef.current.querySelector('iframe')) {
            console.log(`[DEBUG:${debugIdRef.current}] Telegram widget failed to initialize after attempt ${widgetAttempts + 1}`);
            
            if (widgetAttempts >= 2) {
              console.log(`[DEBUG:${debugIdRef.current}] Max attempts reached, switching to fallback button`);
              setUseFallbackButton(true);
            } else {
              setWidgetAttempts(prev => prev + 1);
            }
          } else {
            setWidgetInitialized(true);
          }
        }, 2000);
      } catch (err) {
        console.error(`[DEBUG:${debugIdRef.current}] Error initializing Telegram widget:`, err);
        setError('Error initializing Telegram login. Please refresh the page and try again.');
        setUseFallbackButton(true);
      }
    }
  }, [scriptLoaded, isSignUp, botId, widgetAttempts, useFallbackButton]);

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
    // Open Telegram login flow manually
    const telegramAuthUrl = `https://telegram.me/${botId}?start=auth_${isSignUp ? 'signup' : 'signin'}`;
    
    toast({
      title: "Telegram Login",
      description: "Opening Telegram authentication. Please continue in the Telegram app.",
    });
    
    // First try to open in app if possible
    window.location.href = telegramAuthUrl;
    
    // Reset widget attempts to try again on next render
    setWidgetAttempts(0);
    setUseFallbackButton(false);
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
