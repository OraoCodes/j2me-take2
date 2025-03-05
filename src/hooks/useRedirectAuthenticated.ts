
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useRedirectAuthenticated = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          return;
        }
        
        if (session) {
          console.log("Session found, checking user profile...");
          await redirectBasedOnUserStatus(session.user);
        } else {
          console.log("No active session found");
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event);
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
    if (!user) {
      console.log("No user object found, not redirecting");
      return;
    }
    
    try {
      console.log("Checking profile for user:", user.id);
      // Check if user has completed onboarding by checking if they have a profession set
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profession, company_name')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
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
      console.log("Redirecting to dashboard due to error");
      navigate("/dashboard");
    }
  };
};
