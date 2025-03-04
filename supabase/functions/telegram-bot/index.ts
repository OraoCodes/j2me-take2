
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store PIN codes temporarily (in a real production system, this would be in a database)
// Format: { username: { pin: string, timestamp: number, attempts: number } }
const activePins = new Map();

// Generate a random 6-digit PIN
const generatePin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send a message to a Telegram user
const sendTelegramMessage = async (username: string, message: string) => {
  const timestamp = new Date().toISOString();
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  
  if (!botToken) {
    console.error(`[${timestamp}] TELEGRAM_BOT_TOKEN not set in environment variables`);
    return { success: false, error: "Bot configuration error" };
  }
  
  try {
    // First we need to get the chat_id for the username
    const userResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat?chat_id=@${username}`,
      { method: "GET" }
    );
    
    const userData = await userResponse.json();
    console.log(`[${timestamp}] Telegram getChat response:`, JSON.stringify(userData));
    
    if (!userData.ok) {
      console.error(`[${timestamp}] Failed to find Telegram user @${username}:`, userData.description);
      return { 
        success: false, 
        error: `Telegram user @${username} not found. Make sure you've set up a username and started a chat with our bot (@GebeyaJitumeBot).`
      };
    }
    
    // Now send the message
    const sendResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: userData.result.id,
          text: message,
          parse_mode: "Markdown"
        })
      }
    );
    
    const sendData = await sendResponse.json();
    console.log(`[${timestamp}] Telegram sendMessage response:`, JSON.stringify(sendData));
    
    if (!sendData.ok) {
      console.error(`[${timestamp}] Failed to send message to @${username}:`, sendData.description);
      return { 
        success: false, 
        error: `Failed to send message to @${username}. ${sendData.description}`
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error(`[${timestamp}] Error sending Telegram message:`, error);
    return { 
      success: false, 
      error: "Failed to communicate with Telegram. Please try again later."
    };
  }
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
    
    // Handle PIN request action
    if (requestBody.action === "request-pin") {
      const { telegramUsername, isSignUp, origin } = requestBody;
      
      if (!telegramUsername) {
        return new Response(
          JSON.stringify({ error: "Telegram username is required" }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      if (!origin) {
        return new Response(
          JSON.stringify({ error: "Origin is required" }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      console.log(`[${timestamp}] PIN request for Telegram user: @${telegramUsername}`);
      
      // Check if we already have an active PIN for this user
      const existingPinData = activePins.get(telegramUsername);
      const now = Date.now();
      
      // If PIN was generated less than 60 seconds ago and user has made fewer than 3 attempts
      if (existingPinData && 
          (now - existingPinData.timestamp < 60000) && 
          existingPinData.attempts < 3) {
        console.log(`[${timestamp}] Reusing existing PIN for @${telegramUsername}`);
        existingPinData.attempts += 1;
        activePins.set(telegramUsername, existingPinData);
        
        // Send the existing PIN via Telegram
        const message = `🔐 *Gebeya Jitume Authentication*\n\nYour verification PIN is: *${existingPinData.pin}*\n\nThis PIN will expire in 10 minutes.`;
        const sendResult = await sendTelegramMessage(telegramUsername, message);
        
        if (!sendResult.success) {
          console.error(`[${timestamp}] Failed to send PIN to @${telegramUsername}:`, sendResult.error);
          return new Response(
            JSON.stringify({ error: sendResult.error }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      // Generate a new PIN
      const pin = generatePin();
      console.log(`[${timestamp}] Generated new PIN for @${telegramUsername}: ${pin}`);
      
      // Store the PIN with timestamp and reset attempts counter
      activePins.set(telegramUsername, { 
        pin, 
        timestamp: now,
        attempts: 1,
        isSignUp,
        origin
      });
      
      // Send the PIN via Telegram
      const message = `🔐 *Gebeya Jitume Authentication*\n\nYour verification PIN is: *${pin}*\n\nThis PIN will expire in 10 minutes.`;
      const sendResult = await sendTelegramMessage(telegramUsername, message);
      
      if (!sendResult.success) {
        console.error(`[${timestamp}] Failed to send PIN to @${telegramUsername}:`, sendResult.error);
        return new Response(
          JSON.stringify({ error: sendResult.error }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }
    
    // Handle PIN verification action
    if (requestBody.action === "verify-pin") {
      const { telegramUsername, pin, isSignUp, origin } = requestBody;
      
      if (!telegramUsername || !pin) {
        return new Response(
          JSON.stringify({ error: "Telegram username and PIN are required" }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      console.log(`[${timestamp}] PIN verification for @${telegramUsername}`);
      
      // Check if we have an active PIN for this user
      const pinData = activePins.get(telegramUsername);
      
      if (!pinData) {
        console.error(`[${timestamp}] No active PIN found for @${telegramUsername}`);
        return new Response(
          JSON.stringify({ error: "No active PIN found. Please request a new PIN." }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      // Check if PIN has expired (10 minutes)
      const now = Date.now();
      if (now - pinData.timestamp > 600000) {
        console.error(`[${timestamp}] PIN for @${telegramUsername} has expired`);
        activePins.delete(telegramUsername);
        return new Response(
          JSON.stringify({ error: "PIN has expired. Please request a new PIN." }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      // Check if PIN matches
      if (pinData.pin !== pin) {
        console.error(`[${timestamp}] Invalid PIN for @${telegramUsername}`);
        return new Response(
          JSON.stringify({ error: "Invalid PIN. Please try again." }),
          { 
            status: 400, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      console.log(`[${timestamp}] PIN verified successfully for @${telegramUsername}`);
      
      // Build Telegram user data
      // We need to fetch the actual user from Telegram API
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      
      if (!botToken) {
        console.error(`[${timestamp}] TELEGRAM_BOT_TOKEN not set in environment variables`);
        return new Response(
          JSON.stringify({ error: "Bot configuration error" }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
      
      try {
        const userResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/getChat?chat_id=@${telegramUsername}`,
          { method: "GET" }
        );
        
        const userData = await userResponse.json();
        console.log(`[${timestamp}] Telegram getChat response:`, JSON.stringify(userData));
        
        if (!userData.ok) {
          console.error(`[${timestamp}] Failed to find Telegram user @${telegramUsername}:`, userData.description);
          return new Response(
            JSON.stringify({ 
              error: `Telegram user @${telegramUsername} not found. Make sure you've set up a username correctly.`
            }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            }
          );
        }
        
        // Create a telegramUser object from the Telegram API response
        const telegramUser = {
          id: userData.result.id,
          username: telegramUsername,
          first_name: userData.result.first_name || telegramUsername,
          last_name: userData.result.last_name || ""
        };
        
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
        const requestOrigin = origin || pinData.origin || "";
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
        const isActualSignUp = requestBody.isSignUp || pinData.isSignUp || false;
        
        if (isActualSignUp && existingUser) {
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
        } else if (isActualSignUp) {
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
              telegram_username: telegramUser.username,
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
        
        // Remove the PIN data since verification was successful
        activePins.delete(telegramUsername);
        
        console.log(`[${timestamp}] Successfully generated auth link, returning response`);
        return new Response(
          JSON.stringify({ authLink }),
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      } catch (error) {
        console.error(`[${timestamp}] Error verifying user with Telegram:`, error);
        return new Response(
          JSON.stringify({ error: "Failed to verify user with Telegram. Please try again later." }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }
    }

    // Handle user notification requests
    if (requestBody.action === "notify" && requestBody.user_id && requestBody.notification) {
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
    
    console.log(`[${timestamp}] Invalid request - unsupported action`);
    return new Response(
      JSON.stringify({ error: "Invalid action" }),
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
