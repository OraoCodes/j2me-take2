
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { loadOtplessSDK } from '@/utils/otplessLoader';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

// We'll create a TypeScript interface for the OTPless response
interface OTPlessResponse {
  token: string;
  data?: {
    waName?: string;
    waNumber?: string;
    waId?: string;
  };
}

// Declare the global otpless object for TypeScript
declare global {
  interface Window {
    otpless: {
      auth: (params: {
        /** The callback function that will be called with the OTPless response */
        callback: (response: OTPlessResponse) => void;
      }) => void;
    };
  }
}

export const OTPlessWhatsAppLoginButton = ({ isSignUp = false }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const navigate = useNavigate();
  const otplessDivRef = useRef<HTMLDivElement>(null);
  const debugIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));
  const [retryCount, setRetryCount] = useState(0);

  // Load the OTPless SDK
  useEffect(() => {
    const loadSDK = async () => {
      try {
        await loadOtplessSDK();
        setSdkLoaded(true);
        console.log(`[DEBUG:${debugIdRef.current}] OTPless SDK loaded successfully`);
      } catch (error) {
        console.error(`[DEBUG:${debugIdRef.current}] Failed to load OTPless SDK:`, error);
        setError('Failed to load WhatsApp login. Please try again later.');
        // If we haven't tried too many times, retry loading
        if (retryCount < 3) {
          console.log(`[DEBUG:${debugIdRef.current}] Retrying SDK load, attempt ${retryCount + 1}`);
          setRetryCount(prev => prev + 1);
          // Try again after a short delay
          setTimeout(() => loadSDK(), 1500);
        }
      }
    };
    
    if (!sdkLoaded) {
      loadSDK();
    }
  }, [retryCount, sdkLoaded]);

  // Initialize the OTPless container
  useEffect(() => {
    if (sdkLoaded && otplessDivRef.current && window.otpless) {
      console.log(`[DEBUG:${debugIdRef.current}] SDK loaded, initializing OTPless container`);
      
      // Initialize the OTPless button
      const otplessDiv = document.createElement('div');
      otplessDiv.id = 'otpless-login-page';
      otplessDiv.style.display = 'none'; // Hide the button as we'll use our custom button
      
      // Clear and append the OTPless div
      otplessDivRef.current.innerHTML = '';
      otplessDivRef.current.appendChild(otplessDiv);
    }
  }, [sdkLoaded]);

  const initiateOTPlessAuth = () => {
    if (!window.otpless || !sdkLoaded) {
      console.error(`[DEBUG:${debugIdRef.current}] OTPless SDK not loaded yet`);
      // Try to reload the SDK before showing error
      loadOtplessSDK().then(() => {
        setSdkLoaded(true);
        console.log(`[DEBUG:${debugIdRef.current}] OTPless SDK loaded on demand`);
        // Try again after a short delay to allow initialization
        setTimeout(() => initiateOTPlessAuth(), 500);
      }).catch(err => {
        console.error(`[DEBUG:${debugIdRef.current}] Failed to load OTPless SDK on demand:`, err);
        toast({
          variant: "destructive",
          title: "WhatsApp Login Error",
          description: "Login service not available. Please try again later."
        });
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[DEBUG:${debugIdRef.current}] Initiating OTPless auth, window.otpless:`, window.otpless ? 'available' : 'not available');
      
      // Use the OTPless SDK for authentication
      window.otpless.auth({
        callback: async (response) => {
          console.log(`[DEBUG:${debugIdRef.current}] OTPless response:`, response);
          
          if (!response || !response.token) {
            setError("Authentication failed. Please try again.");
            setIsLoading(false);
            return;
          }
          
          try {
            // Process the OTPless token through Supabase
            const { data, error } = await supabase.functions.invoke('otpless-auth', {
              body: { 
                token: response.token,
                userData: response.data,
                isSignUp
              }
            });
            
            if (error) {
              console.error(`[DEBUG:${debugIdRef.current}] Error processing OTPless auth:`, error);
              toast({
                variant: "destructive",
                title: "Authentication Error",
                description: error.message || "Failed to authenticate with WhatsApp"
              });
              setIsLoading(false);
              return;
            }
            
            console.log(`[DEBUG:${debugIdRef.current}] OTPless auth response:`, data);
            
            // Handle successful authentication
            if (data?.session) {
              // Set auth flow type in localStorage
              const authFlow = isSignUp ? 'signup' : 'signin';
              localStorage.setItem('whatsapp_auth_flow', authFlow);
              
              // Navigate based on the auth flow
              if (isSignUp) {
                navigate("/onboarding");
              } else {
                navigate("/dashboard");
              }
              
              toast({
                title: "Success",
                description: isSignUp ? "Account created successfully!" : "Signed in successfully!"
              });
            } else if (data?.error) {
              setError(data.error);
              toast({
                variant: "destructive",
                title: "Authentication Error",
                description: data.error
              });
            } else {
              setError("An unexpected error occurred. Please try again.");
              toast({
                variant: "destructive",
                title: "Authentication Error",
                description: "An unexpected error occurred during authentication"
              });
            }
          } catch (err: any) {
            console.error(`[DEBUG:${debugIdRef.current}] Unexpected error in OTPless auth:`, err);
            toast({
              variant: "destructive",
              title: "Authentication Error",
              description: err?.message || "An unexpected error occurred"
            });
          } finally {
            setIsLoading(false);
          }
        }
      });
    } catch (err: any) {
      console.error(`[DEBUG:${debugIdRef.current}] Error initiating OTPless auth:`, err);
      setError(err?.message || "Failed to initiate WhatsApp login");
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
      
      <div ref={otplessDivRef} className="hidden">
        {/* OTPless will create its button here */}
      </div>
      
      <Button
        className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white"
        onClick={initiateOTPlessAuth}
        disabled={isLoading}
      >
        {isLoading ? "Connecting..." : isSignUp ? "Sign up with WhatsApp (OTPless)" : "Sign in with WhatsApp (OTPless)"}
      </Button>
    </div>
  );
};
