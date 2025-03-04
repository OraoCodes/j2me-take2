
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ivndgetmkcwapmttsbqa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2bmRnZXRta2N3YXBtdHRzYnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNzkyOTksImV4cCI6MjA1NTk1NTI5OX0.NWD55D_pTuf7Ddk_8mZJBtsZg7dsPaVVVJ5e8wpZzMY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Determine the current origin for redirects
const origin = typeof window !== 'undefined' ? window.location.origin : '';

// Configure the redirect URL for auth redirects
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    redirectTo: `${origin}/auth?tab=signin`,
    // We're using a custom email service, so we need to handle redirects differently
    emailRedirectTo: `${origin}/auth?tab=signin`
  }
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);

// Helper for custom auth emails
export async function sendAuthEmail(email: string, type: 'signup' | 'reset' | 'magic_link', redirectUrl: string) {
  try {
    const response = await supabase.functions.invoke('resend-auth-email', {
      body: {
        email,
        type,
        redirectUrl: redirectUrl || `${origin}/auth?tab=signin`,
        meta: {
          origin
        }
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error sending custom auth email:', error);
    throw error;
  }
}
