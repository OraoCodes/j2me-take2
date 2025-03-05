
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useRedirectAuthenticated = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isOnboardingPage = location.pathname === "/onboarding";
  const isAuthPage = location.pathname === "/auth";
  const isDashboardPage = location.pathname === "/dashboard";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking session in useRedirectAuthenticated...");
        
        // Check for URL auth parameters (from OAuth redirects)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasAuthParams = urlParams.has('access_token') || 
                             urlParams.has('refresh_token') || 
                             urlParams.has('error') ||
                             urlParams.has('code') ||
                             hashParams.get('access_token') ||
                             hashParams.get('refresh_token');
        
        // If we have auth params and we're on the auth page, wait for the auth state to update
        if (hasAuthParams && isAuthPage) {
          console.log("Detected auth params on auth page, waiting for auth state update...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          return;
        }
        
        if (session) {
          console.log("Session found in useRedirectAuthenticated, checking user profile...");
          
          // Don't redirect if already on the onboarding or dashboard page to prevent loops
          if (!isOnboardingPage && !isDashboardPage) {
            await redirectBasedOnUserStatus(session.user);
          }
        } else {
          console.log("No active session found");
          // If user is not authenticated and tries to access restricted pages, redirect to auth
          if (!isAuthPage && !location.pathname.startsWith("/auth") && 
              (location.pathname.includes("dashboard") || location.pathname === "/onboarding")) {
            navigate("/auth?tab=signin");
          }
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed in useRedirectAuthenticated:", event);
      
      // Redirect on sign in events, but not when already on appropriate pages
      if (session) {
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED')) {
          console.log("User authenticated, redirecting...");
          if (!isOnboardingPage && !isDashboardPage) {
            await redirectBasedOnUserStatus(session.user);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Redirect to auth page when signed out
        navigate("/auth?tab=signin");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, isOnboardingPage, isAuthPage, isDashboardPage, location.pathname, toast]);

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
        // If it's a data error (not found), redirect to onboarding
        if (error.code && error.code.startsWith('PGRST')) {
          console.log("Profile not found or incomplete, redirecting to onboarding");
          navigate("/onboarding");
          return;
        }
        
        // For other errors (like network), don't redirect to avoid loops
        toast({
          variant: "destructive",
          title: "Error",
          description: "There was a problem loading your profile. Please try again."
        });
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem checking your profile status."
      });
    }
  };
};
