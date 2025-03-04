
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Key, User, AlertCircle } from "lucide-react";
import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { WhatsAppLoginButton } from "@/components/auth/WhatsAppLoginButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  const defaultTab = searchParams.get("tab") || "signin";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('Auth component mounted, defaultTab:', defaultTab);
    
    // Check if user is already authenticated
    const checkSession = async () => {
      console.log('Checking for existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Session found, user is authenticated:', session.user.id);
        // Get the stored auth flow type
        const authFlow = localStorage.getItem('telegram_auth_flow');
        console.log('Retrieved auth flow from localStorage:', authFlow);
        
        if (authFlow === 'signup') {
          console.log('Navigating to onboarding...');
          navigate('/onboarding');
        } else {
          console.log('Navigating to dashboard...');
          navigate('/dashboard');
        }
        
        // Clean up after successful redirect
        localStorage.removeItem('telegram_auth_flow');
        console.log('Removed telegram_auth_flow from localStorage');
      } else {
        console.log('No session found, staying on auth page');
      }
    };
    
    checkSession();
    
    // Listen for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change event:', event, 'Session:', session ? 'exists' : 'null');
      
      if (event === 'SIGNED_IN' && session) {
        console.log('User signed in event detected, user id:', session.user.id);
        // Get the stored auth flow type
        const authFlow = localStorage.getItem('telegram_auth_flow');
        console.log('Retrieved auth flow from localStorage after SIGNED_IN event:', authFlow);
        
        if (authFlow === 'signup') {
          console.log('Navigating to onboarding based on auth event...');
          navigate('/onboarding');
        } else {
          console.log('Navigating to dashboard based on auth event...');
          navigate('/dashboard');
        }
        
        // Clean up after successful redirect
        localStorage.removeItem('telegram_auth_flow');
        console.log('Removed telegram_auth_flow from localStorage');
      }
    });
    
    // Check URL for error parameters
    const urlErrorMessage = searchParams.get("error_description") || searchParams.get("error");
    if (urlErrorMessage) {
      console.log('Error found in URL parameters:', urlErrorMessage);
      setErrorMessage(urlErrorMessage);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: urlErrorMessage
      });
    }
    
    return () => {
      console.log('Auth component unmounting, cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, toast]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        setIsLoading(false);
      } else {
        localStorage.setItem('telegram_auth_flow', 'signup');
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        navigate("/onboarding");
      }
    } catch (error: any) {
      console.error('Unexpected sign up error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "An unexpected error occurred during sign up.",
      });
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
        setIsLoading(false);
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('Unexpected sign in error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "An unexpected error occurred during sign in.",
      });
      setIsLoading(false);
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

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-50 border-blue-100">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-700">Important: Telegram Authentication</AlertTitle>
          <AlertDescription className="text-blue-600 text-sm">
            <p>To use Telegram authentication, you <strong>must</strong> have a username set in your Telegram profile settings:</p>
            <ol className="mt-2 list-decimal list-inside text-xs">
              <li>Open Telegram app</li>
              <li>Go to Settings</li>
              <li>Tap on your profile info</li>
              <li>Set a username</li>
            </ol>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <div className="space-y-4">
              <div className="grid gap-2">
                <WhatsAppLoginButton isSignUp={false} />
                <TelegramLoginButton isSignUp={false} />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
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
              </form>
            </div>
          </TabsContent>

          <TabsContent value="signup">
            <div className="space-y-4">
              <div className="grid gap-2">
                <WhatsAppLoginButton isSignUp={true} />
                <TelegramLoginButton isSignUp={true} />
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      name="fullName"
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
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
