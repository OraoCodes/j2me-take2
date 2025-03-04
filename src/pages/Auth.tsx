import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase, sendAuthEmail } from "@/integrations/supabase/client";
import { Mail, Key, AlertCircle, Check, RefreshCw, Info, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [providerError, setProviderError] = useState<string | null>(null);
  const [signupResponse, setSignupResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "signin");
  const { toast } = useToast();
  const navigate = useNavigate();

  const defaultTab = searchParams.get("tab") || "signin";

  useEffect(() => {
    setActiveTab(defaultTab);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectBasedOnUserStatus(session.user);
      }
    });

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
    
    const { data: { subscription }} = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      if (event === 'SIGNED_IN' && session) {
        await redirectBasedOnUserStatus(session.user);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, toast]);

  const redirectBasedOnUserStatus = async (user) => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profession, company_name')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (!profile?.profession || !profile?.company_name) {
        console.log("User needs to complete onboarding, redirecting to /onboarding");
        navigate("/onboarding");
      } else {
        console.log("User has completed onboarding, redirecting to /dashboard");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      navigate("/dashboard");
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupResponse(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      console.log("Attempting custom signup for email:", email);
      
      const emailResponse = await sendAuthEmail(
        email, 
        'signup',
        `${window.location.origin}/auth?tab=signin`
      );
      
      console.log("Custom email response:", emailResponse);
      
      if (!emailResponse.success) {
        toast({
          variant: "destructive",
          title: "Email Error",
          description: `Failed to send verification email: ${emailResponse.error}`,
        });
        setSignupResponse({error: emailResponse.error});
      } else {
        setVerificationEmail(email);
        setVerificationSent(true);
        setSignupResponse({
          user: {
            email: email,
            confirmation_sent_at: new Date().toISOString()
          }
        });
        toast({
          title: "Success",
          description: "Verification email sent! Please check your inbox (and spam folder) to complete registration.",
        });
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      setSignupResponse({error: "Unexpected error occurred"});
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setResendLoading(true);
    try {
      console.log("Attempting to resend verification to:", verificationEmail);
      
      const response = await sendAuthEmail(
        verificationEmail,
        'signup',
        `${window.location.origin}/auth?tab=signin`
      );

      if (!response.success) {
        console.error("Error resending verification:", response.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to resend: ${response.error}`,
        });
      } else {
        console.log("Verification email resent:", response);
        toast({
          title: "Verification email resent",
          description: "Please check your inbox and spam folder.",
        });
      }
    } catch (err) {
      console.error("Unexpected error resending verification:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while resending verification.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Signin error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        console.log("Sign in response:", data);
      }
    } catch (err) {
      console.error("Unexpected error during signin:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during sign in.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

        {providerError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>{providerError}</AlertDescription>
          </Alert>
        )}

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
                
                {signupResponse && (
                  <Alert className="bg-gray-50 border-gray-200 mb-4">
                    <Info className="h-4 w-4 text-gray-600" />
                    <AlertTitle className="text-gray-800">Technical Details</AlertTitle>
                    <AlertDescription className="text-xs text-gray-600">
                      <div className="font-mono overflow-auto max-h-24 p-2 bg-gray-100 rounded">
                        {JSON.stringify({
                          userId: signupResponse?.user?.id,
                          email: signupResponse?.user?.email,
                          confirmationSent: signupResponse?.user?.confirmation_sent_at,
                          emailConfirmed: signupResponse?.user?.email_confirmed_at,
                          identities: signupResponse?.user?.identities?.length
                        }, null, 2)}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-800">Troubleshooting verification emails:</h3>
                  
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                    <li>Check your Spam/Junk folder thoroughly</li>
                    <li>Add <strong>noreply@mail.app.supabase.io</strong> to your contacts</li>
                    <li>Check any email filters that might be redirecting messages</li>
                    <li>Try using a different email provider (Gmail, Outlook, etc.)</li>
                    <li>Make sure your Supabase Site URL is set to: <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{window.location.origin}</code></li>
                  </ul>
                </div>
                
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Didn't receive the email? Click below to resend.
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
                  
                  <div className="mt-6 border-t pt-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Still having issues? Try signing up with a different method:
                    </p>
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
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
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
      
      
    </div>
  );
};

export default Auth;
