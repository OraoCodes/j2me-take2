
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { AuthErrorAlert } from "@/components/auth/AuthErrorAlert";
import { useRedirectAuthenticated } from "@/hooks/useRedirectAuthenticated";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [providerError, setProviderError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "signin");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Use custom hook to handle redirects for authenticated users
  useRedirectAuthenticated();

  const defaultTab = searchParams.get("tab") || "signin";

  useEffect(() => {
    setActiveTab(defaultTab);
    
    // Check for authentication errors in the URL
    const errorCode = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    if (errorCode) {
      console.error("Auth error from URL:", errorCode, errorDescription);
      setProviderError(`Authentication error: ${errorDescription || errorCode}`);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorDescription || "An error occurred during sign in",
      });
    }

    // Handle the OAuth callback 
    const handleAuthCallback = async () => {
      // Check for authentication parameters (from OAuth redirects)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const hasAuthParams = urlParams.has('access_token') || 
                            urlParams.has('refresh_token') || 
                            urlParams.has('error') ||
                            urlParams.has('code') ||
                            hashParams.get('access_token') ||
                            hashParams.get('refresh_token');
      
      if (hasAuthParams) {
        console.log("Detected auth callback params, getting session");
        
        try {
          // Wait briefly for auth state to settle
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error processing auth callback:", error);
            setProviderError(`Error completing authentication: ${error.message}`);
          } else if (data?.session) {
            console.log("Successfully authenticated via OAuth:", data.session.user.id);
            toast({
              title: "Authentication Successful",
              description: "You have been signed in successfully!",
            });
            
            // Check if user has completed profile and redirect accordingly
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('profession, company_name, first_name, last_name, service_type, referral_source')
              .eq('id', data.session.user.id)
              .single();
            
            if (profileError || 
                !profile?.profession || 
                !profile?.company_name || 
                !profile?.first_name || 
                !profile?.last_name || 
                !profile?.service_type || 
                !profile?.referral_source) {
              console.log("User needs to complete onboarding, redirecting to /onboarding");
              navigate("/onboarding");
            } else {
              console.log("User has completed onboarding, redirecting to /dashboard");
              navigate("/dashboard");
            }
          }
        } catch (err) {
          console.error("Unexpected error during auth callback:", err);
          setProviderError("An unexpected error occurred while completing authentication");
        }
      }
    };

    handleAuthCallback();
  }, [defaultTab, searchParams, toast, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <img 
        src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" 
        alt="Gebeya" 
        className="h-12 mb-8 animate-fade-up" 
      />
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg animate-fade-up [animation-delay:200ms]">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            {activeTab === "signup" ? "Join us today!" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground">
            {activeTab === "signup" 
              ? "Create an account to get started" 
              : "Sign in to your account to continue"
            }
          </p>
        </div>

        <AuthErrorAlert error={providerError} />

        <Tabs 
          defaultValue={defaultTab} 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <SignInForm setProviderError={setProviderError} />
          </TabsContent>

          <TabsContent value="signup">
            <SignUpForm setProviderError={setProviderError} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
