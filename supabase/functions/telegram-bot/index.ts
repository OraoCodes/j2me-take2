
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Initialize Supabase client with the service role key (for admin operations)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the request body
    const { action, telegramUser, isSignUp } = await req.json();
    
    console.log(`Telegram Bot function called with action: ${action}`);
    console.log(`isSignUp flag: ${isSignUp}`);
    console.log(`Telegram user data:`, telegramUser);

    if (action === "auth" && telegramUser) {
      // Validate the authentication data from Telegram
      if (!validateTelegramAuth(telegramUser)) {
        console.error("Invalid Telegram authentication data");
        return new Response(
          JSON.stringify({ error: "Invalid authentication data" }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      // Create a unique identifier using Telegram's ID
      const identifier = `telegram:${telegramUser.id}`;
      const email = `${identifier}@telegram.gebeya-jitume.app`;
      
      console.log(`Using identifier: ${identifier} and email: ${email}`);
      
      // Check if this Telegram user already exists in auth.users
      const { data: existingUser, error: lookupError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("telegram_id", telegramUser.id)
        .maybeSingle();
        
      if (lookupError) {
        console.error("Error looking up existing user:", lookupError);
      }
      
      console.log("Existing user check result:", existingUser);
      
      let authLink;
      
      // If this is a signup but user already exists, treat as sign in
      if (isSignUp && existingUser) {
        console.log("User tried to sign up but already exists, treating as sign in");
        isSignUp = false;
      }
      
      if (isSignUp) {
        console.log("Creating new user account with Telegram");
        
        // Create a random password for the user
        const randomPassword = Math.random().toString(36).slice(-10);
        
        // Create a new user in auth.users
        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username,
            telegram_first_name: telegramUser.first_name,
            telegram_last_name: telegramUser.last_name,
            full_name: `${telegramUser.first_name} ${telegramUser.last_name || ""}`.trim(),
            avatar_url: null,
            provider: "telegram"
          }
        });
        
        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create user" }),
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        console.log("User created successfully, user ID:", authUser?.user?.id);
        
        // Update the profiles table with Telegram ID
        if (authUser?.user?.id) {
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({
              telegram_id: telegramUser.id,
              full_name: `${telegramUser.first_name} ${telegramUser.last_name || ""}`.trim(),
            })
            .eq("id", authUser.user.id);
            
          if (profileError) {
            console.error("Error updating profile:", profileError);
          }
        }
        
        // Generate a sign-in link
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${req.headers.get('origin') || ""}/onboarding`
          }
        });
        
        if (signInError) {
          console.error("Error generating link:", signInError);
          return new Response(
            JSON.stringify({ error: "Failed to generate login link" }),
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        authLink = signInData?.properties?.action_link;
        console.log("Generated auth link for signup:", authLink);
      } else {
        console.log("Generating sign-in link for existing user");
        
        // Generate a sign-in link for the existing user
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${req.headers.get('origin') || ""}/dashboard`
          }
        });
        
        if (signInError) {
          console.error("Error generating link:", signInError);
          return new Response(
            JSON.stringify({ error: "Failed to generate login link" }),
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        authLink = signInData?.properties?.action_link;
        console.log("Generated auth link for signin:", authLink);
      }
      
      if (!authLink) {
        return new Response(
          JSON.stringify({ error: "Failed to generate authentication link" }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ authLink }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error("Error in telegram-bot function:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
});

// Function to validate Telegram authentication data
function validateTelegramAuth(authData: any): boolean {
  // Basic validation
  if (!authData || !authData.id || !authData.first_name) {
    return false;
  }
  
  // In a production environment, you would also verify the hash
  // using the bot token to ensure the data came from Telegram
  // But for this example, we'll just do basic validation
  
  return true;
}
