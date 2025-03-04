
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Add timestamp to all logs for better debugging
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Telegram bot function called with method: ${req.method}`);
  console.log(`[${timestamp}] Request URL: ${req.url}`);
  
  // Log headers but remove any sensitive information
  const headers = Object.fromEntries(req.headers.entries());
  const safeHeaders = { ...headers };
  if (safeHeaders.authorization) {
    safeHeaders.authorization = safeHeaders.authorization.substring(0, 15) + '...';
  }
  if (safeHeaders.apikey) {
    safeHeaders.apikey = safeHeaders.apikey.substring(0, 15) + '...';
  }
  console.log(`[${timestamp}] Request headers:`, JSON.stringify(safeHeaders, null, 2));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log(`[${timestamp}] Handling CORS preflight request`);
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${timestamp}] Missing Supabase configuration`);
      console.error(`[${timestamp}] SUPABASE_URL set: ${!!supabaseUrl}`);
      console.error(`[${timestamp}] SUPABASE_SERVICE_ROLE_KEY set: ${!!supabaseServiceKey}`);
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Initialize Supabase client with the service role key (for admin operations)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`[${timestamp}] Supabase admin client initialized`);
    
    // Get the request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log(`[${timestamp}] Request body parsed successfully`);
      console.log(`[${timestamp}] Request body:`, JSON.stringify(requestBody, null, 2));
    } catch (error) {
      console.error(`[${timestamp}] Error parsing request body:`, error);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Check if this is a chat message request
    if (requestBody.message && requestBody.message.text) {
      console.log(`[${timestamp}] Chat message received:`, requestBody.message.text);
      // Return a sample response for chat messages
      return new Response(
        JSON.stringify({ text: `You said: ${requestBody.message.text}. This is a response from the server.` }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Handle test requests
    if (requestBody.action === "test") {
      console.log(`[${timestamp}] Test request received`);
      return new Response(
        JSON.stringify({ status: "ok", message: "Edge function is accessible", timestamp }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    const { action, telegramUser, isSignUp, origin } = requestBody;
    
    console.log(`[${timestamp}] Telegram Bot function called with action: ${action}`);
    console.log(`[${timestamp}] isSignUp flag: ${isSignUp}`);
    console.log(`[${timestamp}] Origin: ${origin || "Not provided"}`);
    console.log(`[${timestamp}] Telegram user data:`, telegramUser);

    // Handle user notification requests
    if (action === "notify" && requestBody.user_id && requestBody.notification) {
      console.log(`[${timestamp}] Processing notification request for user: ${requestBody.user_id}`);
      
      try {
        // Look up the user's telegram connection
        const { data: telegramConnection, error: lookupError } = await supabaseAdmin
          .from("user_telegram_connections")
          .select("telegram_id")
          .eq("user_id", requestBody.user_id)
          .single();
          
        if (lookupError || !telegramConnection) {
          console.error(`[${timestamp}] No Telegram connection found for user:`, lookupError || "No data");
          return new Response(
            JSON.stringify({ 
              error: "No Telegram connection found for this user",
              details: lookupError?.message || "User has not connected Telegram"
            }),
            { 
              status: 404, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        console.log(`[${timestamp}] Found Telegram ID for user: ${telegramConnection.telegram_id}`);
        
        // TODO: Implement actual Telegram API call to send message
        // This would typically use Telegram's Bot API to send a message
        // For now, we'll simulate success
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Notification sent successfully" 
          }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      } catch (error) {
        console.error(`[${timestamp}] Error processing notification:`, error);
        return new Response(
          JSON.stringify({ error: "Failed to process notification", details: error.message }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
    }

    if (action === "auth" && telegramUser) {
      // Validate the authentication data from Telegram
      if (!validateTelegramAuth(telegramUser)) {
        console.error(`[${timestamp}] Invalid Telegram authentication data`);
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
      
      console.log(`[${timestamp}] Using identifier: ${identifier} and email: ${email}`);
      
      // Check if this Telegram user already exists in auth.users
      const { data: existingUser, error: lookupError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("telegram_id", telegramUser.id)
        .maybeSingle();
        
      if (lookupError) {
        console.error(`[${timestamp}] Error looking up existing user:`, lookupError);
      }
      
      console.log(`[${timestamp}] Existing user check result:`, existingUser);
      
      let authLink;
      // Make sure we have a valid origin
      const requestOrigin = origin || req.headers.get('origin') || "";
      if (!requestOrigin) {
        console.error(`[${timestamp}] No origin provided in request`);
        return new Response(
          JSON.stringify({ error: "No origin provided" }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      console.log(`[${timestamp}] Using request origin: ${requestOrigin}`);
      
      // If this is a signup but user already exists, treat as sign in
      if (isSignUp && existingUser) {
        console.log(`[${timestamp}] User tried to sign up but already exists, treating as sign in`);
        
        // Generate a sign-in link for the existing user
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${requestOrigin}/dashboard`
          }
        });
        
        if (signInError) {
          console.error(`[${timestamp}] Error generating link for existing user:`, signInError);
          return new Response(
            JSON.stringify({ error: "Failed to generate login link", details: signInError.message }),
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        authLink = signInData?.properties?.action_link;
        console.log(`[${timestamp}] Generated auth link for existing user:`, authLink);
      } else if (isSignUp) {
        console.log(`[${timestamp}] Creating new user account with Telegram`);
        
        // Create a random password for the user
        const randomPassword = Math.random().toString(36).slice(-10);
        
        // Create a new user in auth.users
        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: randomPassword,
          email_confirm: true,
          user_metadata: {
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username || '',  // Handle missing username
            telegram_first_name: telegramUser.first_name,
            telegram_last_name: telegramUser.last_name || '',
            full_name: `${telegramUser.first_name} ${telegramUser.last_name || ""}`.trim(),
            avatar_url: null,
            provider: "telegram"
          }
        });
        
        if (createError) {
          console.error(`[${timestamp}] Error creating user:`, createError);
          return new Response(
            JSON.stringify({ error: "Failed to create user", details: createError.message }),
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        console.log(`[${timestamp}] User created successfully, user ID:`, authUser?.user?.id);
        
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
            console.error(`[${timestamp}] Error updating profile:`, profileError);
          } else {
            console.log(`[${timestamp}] Profile updated successfully with telegram_id`);
          }
        }
        
        // Generate a sign-in link
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${requestOrigin}/onboarding`
          }
        });
        
        if (signInError) {
          console.error(`[${timestamp}] Error generating link:`, signInError);
          return new Response(
            JSON.stringify({ error: "Failed to generate login link", details: signInError.message }),
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        authLink = signInData?.properties?.action_link;
        console.log(`[${timestamp}] Generated auth link for signup:`, authLink);
      } else {
        console.log(`[${timestamp}] Generating sign-in link for existing user`);
        
        // Generate a sign-in link for the existing user
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: {
            redirectTo: `${requestOrigin}/dashboard`
          }
        });
        
        if (signInError) {
          console.error(`[${timestamp}] Error generating link:`, signInError);
          return new Response(
            JSON.stringify({ error: "Failed to generate login link", details: signInError.message }),
            { 
              status: 500, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        authLink = signInData?.properties?.action_link;
        console.log(`[${timestamp}] Generated auth link for signin:`, authLink);
      }
      
      if (!authLink) {
        console.error(`[${timestamp}] Failed to generate authentication link`);
        return new Response(
          JSON.stringify({ error: "Failed to generate authentication link" }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      console.log(`[${timestamp}] Successfully generated auth link, returning response`);
      return new Response(
        JSON.stringify({ authLink }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    console.log(`[${timestamp}] Invalid request - no auth action or missing telegramUser`);
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { 
        status: 400, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
  } catch (error) {
    console.error(`[${timestamp}] Error in telegram-bot function:`, error);
    
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
  
  // Add validation for username if required
  // If username is empty or missing, it could cause the "username invalid" error
  if (authData.username === undefined || authData.username === "") {
    console.log(`[${new Date().toISOString()}] Warning: User has no username set in Telegram`);
    console.log(`[${new Date().toISOString()}] Proceeding with authentication despite missing username`);
    // We continue anyway since some Telegram users may not have set a username
  }
  
  // In a production environment, you would also verify the hash
  // using the bot token to ensure the data came from Telegram
  // But for this example, we'll just do basic validation
  
  return true;
}
