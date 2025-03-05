
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const useRedirectAuthenticated = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnboardingPage = location.pathname === "/onboarding";
  const isAuthPage = location.pathname === "/auth";

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
          
          // Don't redirect if already on the onboarding page to prevent loops
          if (!isOnboardingPage) {
            await redirectBasedOnUserStatus(session.user);
          }
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
      
      // Redirect on sign in events, but not when already on onboarding
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        console.log("User signed in or updated, redirecting...");
        if (!isOnboardingPage) {
          await redirectBasedOnUserStatus(session.user);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, isOnboardingPage, isAuthPage]);

  // Redirect based on user status with improved error handling
  const redirectBasedOnUserStatus = async (user) => {
    if (!user) {
      console.log("No user object found, not redirecting");
      return;
    }
    
    try {
      console.log("Checking profile for user:", user.id);
      // Check if user has completed onboarding by checking if they have all required fields
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('profession, company_name, first_name, last_name, service_type, referral_source')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        // Only redirect to onboarding if there's a specific database error
        // For other errors (like network), don't redirect to avoid loops
        if (error.code && error.code.startsWith('PGRST')) {
          console.log("Database-related error, redirecting to onboarding");
          navigate("/onboarding");
        }
        return;
      }
      
      console.log("Profile data:", profile);
      
      // Check if all required fields are set
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
      // Don't redirect on unexpected errors to avoid loops
    }
  };
};
