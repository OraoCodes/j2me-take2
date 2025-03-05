
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface GoogleButtonProps {
  variant?: "default" | "outline";
  text: string;
  setProviderError: (error: string | null) => void;
}

export const GoogleButton = ({ variant = "outline", text, setProviderError }: GoogleButtonProps) => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setProviderError(null);

    try {
      console.log("Starting Google sign-in process...");
      
      const redirectUrl = `${window.location.origin}/auth?tab=signin`;
      console.log("Redirect URL:", redirectUrl);
      
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error("Google sign-in error:", error);
        
        if (error.message.includes("provider is not enabled") || error.status === 400) {
          setProviderError("Google login is not properly configured. Please make sure Google provider is enabled in Supabase.");
        } else {
          setProviderError(`Error: ${error.message}`);
        }
        
        toast({
          variant: "destructive",
          title: "Google Sign In Error",
          description: `${error.message} (Code: ${error.status || 'unknown'})`,
        });
        setGoogleLoading(false);
      } else {
        console.log("Google sign-in initiated successfully:", data);
        setGoogleLoading(false);
      }
    } catch (e) {
      console.error("Unexpected error during Google sign-in:", e);
      toast({
        variant: "destructive",
        title: "Unexpected Error",
        description: "An unexpected error occurred. Please try again.",
      });
      setGoogleLoading(false);
    }
  };

  return (
    <Button 
      type="button"
      variant={variant}
      className="w-full flex items-center justify-center gap-2"
      onClick={handleGoogleSignIn}
      disabled={googleLoading}
    >
      {googleLoading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          {text}
        </>
      )}
    </Button>
  );
};
