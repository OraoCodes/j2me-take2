
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Key, User, AlertCircle, Check, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [providerError, setProviderError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const defaultTab = searchParams.get("tab") || "signin";

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Check for auth errors in the URL
    const errorCode = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    if (errorCode) {
      console.error("Auth error:", errorCode, errorDescription);
      setProviderError(`Authentication error: ${errorDescription || errorCode}`);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorDescription || "An error occurred during sign in",
      });
    }
    
    // Listen for auth state changes
    const { data: { subscription }} = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      if (event === 'SIGNED_IN' && session) {
        navigate("/dashboard");
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, toast]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/auth?tab=signin`,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      console.log("Sign up response:", data);
      setVerificationEmail(email);
      setVerificationSent(true);
      toast({
        title: "Success",
        description: "Verification email sent! Please check your inbox to complete registration.",
      });
    }
    setIsLoading(false);
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setResendLoading(true);
    const { error, data } = await supabase.auth.resend({
      type: 'signup',
      email: verificationEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth?tab=signin`,
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to resend: ${error.message}`,
      });
    } else {
      toast({
        title: "Verification email resent",
        description: "Please check your inbox and spam folder.",
      });
      console.log("Resend response:", data);
    }
    setResendLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      setIsLoading(false);
    } else {
      console.log("Sign in response:", data);
      // Don't show the success toast since we're redirecting immediately
      navigate("/dashboard");
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setProviderError(null); // Reset any previous provider errors
    
    try {
      console.log("Starting Google sign-in process...");
      
      // Debug: Log the redirect URL
      const redirectUrl = `${window.location.origin}/auth?tab=signin`;
      console.log("Redirect URL:", redirectUrl);
      
      // Important: Using redirectTo instead of a popup to avoid X-Frame-Options issue
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Remove any popup options, force full page redirect
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error("Google sign-in error:", error);
        
        // Handle the specific provider not enabled error
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
        // We don't set loading to false here as we'll be redirected
        
        // If we reach this point but no redirection happens, it's probably a configuration issue
        // Let's add a safety timeout to reset the loading state
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            console.log("No redirection happened within timeout period");
            setGoogleLoading(false);
            setProviderError("No redirect occurred. This could be due to popup blockers or incorrect configuration.");
          }
        }, 5000);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <img 
        src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" 
        alt="Gebeya" 
        className="h-12 mb-8 animate-fade-up" 
      />
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg animate-fade-up [animation-delay:200ms]">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            {defaultTab === "signup" ? "Start your journey" : "Welcome back"}
          </h2>
          <p className="text-muted-foreground">
            {defaultTab === "signup" 
              ? "Create your account and start growing your business" 
              : "Sign in to your account to continue"
            }
          </p>
        </div>

        {providerError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>{providerError}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button 
                type="button"
                variant="outline" 
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
                    Sign in with Google
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            {verificationSent ? (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200 mb-4">
                  <Check className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Verification email sent!</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    We've sent a verification email to <strong>{verificationEmail}</strong>. 
                    Please check both your inbox and spam folder.
                  </AlertDescription>
                </Alert>
                
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Didn't receive the email? Check your spam folder or click below to resend.
                  </p>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                  >
                    {resendLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Resend verification email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-firstName"
                      name="firstName"
                      type="text"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastName">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-lastName"
                      name="lastName"
                      type="text"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Email verification required</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    After signing up, you'll need to verify your email before you can log in.
                  </AlertDescription>
                </Alert>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button 
                  type="button"
                  variant="outline" 
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
                      Sign up with Google
                    </>
                  )}
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mt-4 text-sm text-center text-gray-500">
        Having trouble signing in? <a href="mailto:support@gebeya.com" className="text-gebeya-pink hover:underline">Contact support</a>
      </div>
    </div>
  );
};

export default Auth;
