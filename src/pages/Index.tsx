
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { Cta } from "@/components/Cta";
import { ProblemSolution } from "@/components/ProblemSolution";
import { Testimonials } from "@/components/Testimonials";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      // Check if we're redirected from Google auth and have a session
      const urlParams = new URLSearchParams(window.location.search);
      const hasAuthParams = urlParams.has('access_token') || 
                           urlParams.has('refresh_token') || 
                           urlParams.has('error') ||
                           urlParams.has('code');
      
      if (hasAuthParams) {
        console.log("Detected auth params in URL, handling auth callback...");
        
        // If there's an error in the URL params, show a toast
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        if (error) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: errorDescription || "An error occurred during authentication"
          });
          return;
        }
        
        // Explicitly wait for auth state to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        return;
      }
      
      if (session) {
        console.log("Session found in Index, redirecting...");
        // Redirect based on profile completion status
        await redirectBasedOnUserStatus(session.user);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed in Index:", event);
      if (session) {
        if (event === 'SIGNED_IN' || event === 'SIGNED_UP' || event === 'TOKEN_REFRESHED') {
          await redirectBasedOnUserStatus(session.user);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  // Redirect based on user status
  const redirectBasedOnUserStatus = async (user) => {
    if (!user) return;
    
    try {
      console.log("Checking profile for user:", user.id);
      
      // Check if user has completed onboarding by checking if they have a profession set
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profession, company_name, first_name, last_name, service_type, referral_source')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Profile fetch error:", error);
        
        // If it's a data error (not found), redirect to onboarding
        if (error.code?.startsWith('PGRST')) {
          console.log("Profile not found or incomplete, redirecting to /onboarding");
          navigate("/onboarding");
          return;
        }
        
        throw error;
      }
      
      console.log("Profile data:", profile);
      
      // Only redirect to onboarding if required fields are not set
      if (!profile?.profession || !profile?.company_name || !profile?.first_name || 
          !profile?.last_name || !profile?.service_type || !profile?.referral_source) {
        console.log("User needs to complete onboarding, redirecting to /onboarding");
        console.log("Missing fields:", {
          profession: !profile?.profession,
          company_name: !profile?.company_name,
          first_name: !profile?.first_name,
          last_name: !profile?.last_name,
          service_type: !profile?.service_type,
          referral_source: !profile?.referral_source
        });
        navigate("/onboarding");
      } else {
        console.log("User has completed onboarding, redirecting to /dashboard");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      // Default to onboarding if there's an error checking profile
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem loading your profile. Please try again."
      });
      navigate("/onboarding");
    }
  };

  const navigateToAuth = (defaultTab: 'signin' | 'signup') => {
    navigate(`/auth?tab=${defaultTab}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" 
                alt="Gebeya" 
                className="h-8"
              />
              <span className="text-xl font-semibold text-gebeya-pink">Jitume</span>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                className="hidden md:inline-flex"
                onClick={() => navigateToAuth('signin')}
              >
                Sign in
              </Button>
              <Button 
                className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white"
                onClick={() => navigateToAuth('signup')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Testimonials />
        <Features />
        <Cta />
      </main>
    </div>
  );
};

export default Index;
