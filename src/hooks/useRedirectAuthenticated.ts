import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useRedirectAuthenticated = () => {
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
};
