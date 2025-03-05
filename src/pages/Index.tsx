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

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await redirectBasedOnUserStatus(session.user);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await redirectBasedOnUserStatus(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Redirect based on user status
  const redirectBasedOnUserStatus = async (user) => {
    if (!user) return;
    
    try {
      // Check if user has completed onboarding by checking if they have a profession set
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profession, company_name')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      // Only redirect to onboarding if profession is not set
      // Otherwise, redirect to dashboard directly
      if (!profile?.profession || !profile?.company_name) {
        console.log("User needs to complete onboarding, redirecting to /onboarding");
        navigate("/onboarding");
      } else {
        console.log("User has completed onboarding, redirecting to /dashboard");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      // Default to dashboard if there's an error checking profile
      navigate("/dashboard");
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
