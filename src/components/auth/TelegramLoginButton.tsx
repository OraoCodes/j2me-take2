
import { useEffect, useState, useCallback, useRef } from 'react';
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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const BOT_ID = '7984716005'; // Telegram bot ID
  const navigate = useNavigate();
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const authAttemptedRef = useRef(false);
  const popupCheckIntervalRef = useRef<number | null>(null);
  const popupRef = useRef<Window | null>(null);
  const debugIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));

  // Create a memoized version of handleTelegramAuth to avoid recreating it on each render
  const handleTelegramAuth = useCallback(async (telegramUser: any) => {
    try {
      const debugId = debugIdRef.current;
      console.log(`[DEBUG:${debugId}] Telegram auth callback received user data:`, telegramUser);
      
      if (!telegramUser) {
        setIsLoading(false);
        throw new Error('Authentication cancelled or failed');
      }
      
      // Set telegram auth flow type in localStorage
      const authFlow = isSignUp ? 'signup' : 'signin';
      console.log(`[DEBUG:${debugId}] Setting telegram_auth_flow to '${authFlow}'`);
      localStorage.setItem('telegram_auth_flow', authFlow);
      
      // Log additional info about the environment
      console.log(`[DEBUG:${debugId}] Current origin:`, window.location.origin);
      console.log(`[DEBUG:${debugId}] Current URL:`, window.location.href);
      
      // Call our Supabase Edge Function
      console.log(`[DEBUG:${debugId}] Calling telegram-bot function with isSignUp:`, isSignUp);
      
      // Add detailed debugging for the function invocation
      console.log(`[DEBUG:${debugId}] Function invocation details:`, {
        functionName: 'telegram-bot',
        requestBody: { 
          action: 'auth', 
          telegramUser,
          isSignUp,
          origin: window.location.origin,
          debug: {
            id: debugId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenSize: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          }
        }
      });
      
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'auth', 
          telegramUser,
          isSignUp,
          origin: window.location.origin,
          debug: {
            id: debugId,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      console.log(`[DEBUG:${debugId}] Response from telegram-bot function:`, { data, error });
      
      if (error) {
        console.error(`[DEBUG:${debugId}] Telegram auth error from function:`, error);
        throw error;
      }
      
      if (data?.authLink) {
        // Verify the auth flow type is still set
        const storedAuthFlow = localStorage.getItem('telegram_auth_flow');
        console.log(`[DEBUG:${debugId}] Auth flow is set to: '${storedAuthFlow}' before redirect`);
        
        // Directly redirect to the auth link provided by the edge function
        console.log(`[DEBUG:${debugId}] Redirecting to auth link:`, data.authLink);
        window.location.href = data.authLink;
      } else {
        console.error(`[DEBUG:${debugId}] No auth link received from edge function`);
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Could not authenticate with Telegram. No authentication link was provided.",
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error(`[DEBUG:${debugIdRef.current}] Telegram auth error:`, err);
      toast({
        variant: "destructive",
        title: "Authentication failed",
        description: err instanceof Error ? err.message : "An error occurred during authentication"
      });
      setIsLoading(false);
    }
  }, [isSignUp, toast, navigate]);

  // Handle manual cleanup of Telegram resources
  const cleanupTelegramResources = useCallback(() => {
    console.log(`[DEBUG:${debugIdRef.current}] Cleaning up Telegram login resources`);
    // Clear popup check interval if it exists
    if (popupCheckIntervalRef.current) {
      window.clearInterval(popupCheckIntervalRef.current);
      popupCheckIntervalRef.current = null;
      console.log(`[DEBUG:${debugIdRef.current}] Cleared popup check interval`);
    }
    
    // Close popup if it exists and is still open
    if (popupRef.current && !popupRef.current.closed) {
      try {
        popupRef.current.close();
        console.log(`[DEBUG:${debugIdRef.current}] Closed Telegram popup window`);
      } catch (e) {
        console.error(`[DEBUG:${debugIdRef.current}] Error closing popup:`, e);
      }
      popupRef.current = null;
    }
    
    // Remove the global callback
    if (window.onTelegramAuth) {
      delete window.onTelegramAuth;
      console.log(`[DEBUG:${debugIdRef.current}] Removed window.onTelegramAuth`);
    }
    
    // Remove the script element
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
      console.log(`[DEBUG:${debugIdRef.current}] Removed Telegram script element`);
    }
    
    // Remove any Telegram iframe elements that might have been created
    document.querySelectorAll('iframe[src*="telegram.org"]').forEach(iframe => {
      iframe.remove();
      console.log(`[DEBUG:${debugIdRef.current}] Removed Telegram iframe element`);
    });
    
    setScriptLoaded(false);
    authAttemptedRef.current = false;
  }, []);

  useEffect(() => {
    const debugId = debugIdRef.current;
    // Set the global callback that Telegram will use
    window.onTelegramAuth = handleTelegramAuth;
    console.log(`[DEBUG:${debugId}] Set window.onTelegramAuth callback, isSignUp:`, isSignUp);
    
    // Create a test object to verify callback access
    const testObj = { test: true };
    console.log(`[DEBUG:${debugId}] Can access callback directly:`, window.onTelegramAuth === handleTelegramAuth);
    console.log(`[DEBUG:${debugId}] Global object test:`, testObj.test === true);
    
    // Load Telegram Login Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'GebeyaJitumeBot'); 
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-auth-url', window.location.origin + window.location.pathname);
    script.async = true;
    
    // Keep track of script loading status
    script.onload = () => {
      console.log(`[DEBUG:${debugId}] Telegram login script loaded successfully`);
      console.log(`[DEBUG:${debugId}] Telegram Login object available:`, !!window.Telegram?.Login);
      setScriptLoaded(true);
    };
    
    script.onerror = (err) => {
      console.error(`[DEBUG:${debugId}] Failed to load Telegram login script:`, err);
      toast({
        variant: "destructive",
        title: "Failed to load Telegram",
        description: "Could not load Telegram authentication. Please try again later.",
      });
      setScriptLoaded(false);
      setIsLoading(false);
    };
    
    // Cleanup previous script if it exists
    const existingScript = document.getElementById('telegram-login-script');
    if (existingScript) {
      console.log(`[DEBUG:${debugId}] Removing existing Telegram script`);
      existingScript.remove();
    }
    
    script.id = 'telegram-login-script';
    document.body.appendChild(script);
    scriptRef.current = script;
    
    console.log(`[DEBUG:${debugId}] Telegram login component mounted, isSignUp:`, isSignUp);
    console.log(`[DEBUG:${debugId}] Window onTelegramAuth set:`, !!window.onTelegramAuth);

    // Check for auth state changes to reset loading state if needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[DEBUG:${debugId}] Auth state changed:`, event, session ? 'User logged in' : 'No session');
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsLoading(false);
      }
    });

    // Added to directly test whether the function can be invoked
    const testFunctionIsAccessible = async () => {
      try {
        console.log(`[DEBUG:${debugId}] Testing if edge function is accessible...`);
        const { data, error } = await supabase.functions.invoke('telegram-bot', {
          body: { 
            action: 'test', 
            testData: {
              timestamp: new Date().toISOString(),
              debugId
            }
          }
        });
        
        console.log(`[DEBUG:${debugId}] Edge function test result:`, { data, error });
      } catch (e) {
        console.error(`[DEBUG:${debugId}] Edge function test error:`, e);
      }
    };
    
    // Run the test immediately
    testFunctionIsAccessible();

    return () => {
      // Run the cleanup logic
      cleanupTelegramResources();
      
      // Unsubscribe from auth state changes
      subscription.unsubscribe();
      console.log(`[DEBUG:${debugId}] Unsubscribed from auth state changes`);
    };
  }, [handleTelegramAuth, cleanupTelegramResources, isSignUp, toast]);

  const handleTelegramLogin = () => {
    const debugId = debugIdRef.current;
    if (isLoading) {
      console.log(`[DEBUG:${debugId}] Already loading, ignoring click`);
      return;
    }
    
    if (authAttemptedRef.current) {
      console.log(`[DEBUG:${debugId}] Auth already attempted, cleaning up and trying again`);
      cleanupTelegramResources();
      
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        window.location.reload();
      }, 500);
      return;
    }
    
    if (!window.Telegram?.Login?.auth) {
      console.error(`[DEBUG:${debugId}] Telegram Login SDK not loaded properly`);
      console.log(`[DEBUG:${debugId}] Script loaded status:`, scriptLoaded);
      console.log(`[DEBUG:${debugId}] Telegram object available:`, !!window.Telegram);
      console.log(`[DEBUG:${debugId}] Telegram.Login available:`, !!window.Telegram?.Login);
      
      toast({
        variant: "destructive",
        title: "Telegram widget not loaded properly",
        description: "Please try again in a few moments or refresh the page",
      });
      return;
    }
    
    setIsLoading(true);
    authAttemptedRef.current = true;
    console.log(`[DEBUG:${debugId}] Initiating Telegram auth flow, isSignUp:`, isSignUp);
    
    try {
      // Log detailed environment information before attempting auth
      console.log(`[DEBUG:${debugId}] Environment info:`, {
        url: window.location.href,
        origin: window.location.origin,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        botId: BOT_ID,
        timestamp: new Date().toISOString()
      });
      
      // Try to open in a popup to have more control
      const width = 550;
      const height = 470;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      const popupUrl = `https://oauth.telegram.org/auth?bot_id=${BOT_ID}&origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(window.location.href)}`;
      
      console.log(`[DEBUG:${debugId}] Attempting to open popup with URL:`, popupUrl);
      
      // Try to open in a popup first
      try {
        popupRef.current = window.open(
          popupUrl,
          'TelegramAuth',
          `width=${width},height=${height},left=${left},top=${top},status=yes,scrollbars=yes`
        );
        
        if (popupRef.current) {
          console.log(`[DEBUG:${debugId}] Telegram auth popup opened successfully`);
          
          // Check if popup gets closed
          const popupCheckInterval = window.setInterval(() => {
            if (popupRef.current && popupRef.current.closed) {
              console.log(`[DEBUG:${debugId}] Telegram popup was closed`);
              window.clearInterval(popupCheckInterval);
              
              // Give a small delay to see if onTelegramAuth gets called
              setTimeout(() => {
                if (isLoading) {
                  console.log(`[DEBUG:${debugId}] Auth still loading after popup closed, resetting state`);
                  setIsLoading(false);
                  authAttemptedRef.current = false;
                  toast({
                    title: "Authentication cancelled",
                    description: "The Telegram authentication was cancelled. Please try again.",
                  });
                }
              }, 1000);
            }
          }, 1000);
          
          popupCheckIntervalRef.current = popupCheckInterval;
          return;
        } else {
          console.log(`[DEBUG:${debugId}] Popup was blocked, falling back to inline auth`);
        }
      } catch (e) {
        console.error(`[DEBUG:${debugId}] Error opening popup:`, e);
        console.log(`[DEBUG:${debugId}] Falling back to inline auth`);
      }
      
      // Fallback: Force a direct auth call instead of relying on data attributes
      console.log(`[DEBUG:${debugId}] Initiating direct Telegram.Login.auth call`);
      window.Telegram.Login.auth(
        {
          bot_id: BOT_ID,
          request_access: true,
          callback: (user) => {
            console.log(`[DEBUG:${debugId}] Direct Telegram callback with user:`, user ? 'User data received' : 'No user data');
            handleTelegramAuth(user);
          },
        }
      );
      console.log(`[DEBUG:${debugId}] Telegram auth request sent successfully`);
      
      // Set up a check to see if the popup was blocked or closed without completing auth
      if (!popupCheckIntervalRef.current) {
        popupCheckIntervalRef.current = window.setInterval(() => {
          // Check if there's a Telegram popup open
          const telegramPopup = document.querySelector('iframe[src*="telegram.org"]');
          if (!telegramPopup && isLoading) {
            console.log(`[DEBUG:${debugId}] No Telegram popup detected, user might have closed it`);
            window.clearInterval(popupCheckIntervalRef.current!);
            popupCheckIntervalRef.current = null;
            
            // Check if we're still in the loading state after popup closed
            setTimeout(() => {
              if (isLoading) {
                console.log(`[DEBUG:${debugId}] Auth still loading after popup closed, resetting state`);
                setIsLoading(false);
                authAttemptedRef.current = false;
                toast({
                  title: "Authentication cancelled",
                  description: "The Telegram authentication was cancelled. Please try again.",
                });
              }
            }, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      console.error(`[DEBUG:${debugId}] Error initiating Telegram auth:`, error);
      setIsLoading(false);
      authAttemptedRef.current = false;
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
