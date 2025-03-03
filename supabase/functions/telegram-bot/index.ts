
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  user_id?: string;
  chat_id?: string;
  notification: string;
  direct_message?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    console.log("Telegram notification function called");
    
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not set");
      return new Response(
        JSON.stringify({ error: "TELEGRAM_BOT_TOKEN is not set" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" }, 
          status: 500 
        }
      );
    }
    
    const requestData: RequestBody = await req.json();
    console.log("Request data:", JSON.stringify(requestData));
    
    // Direct message to a specific chat ID
    if (requestData.direct_message && requestData.chat_id) {
      console.log(`Sending direct message to chat ID: ${requestData.chat_id}`);
      
      const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const telegramResponse = await fetch(telegramApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: requestData.chat_id,
          text: requestData.notification,
          parse_mode: "HTML",
        }),
      });
      
      const telegramResult = await telegramResponse.json();
      console.log("Telegram API response:", JSON.stringify(telegramResult));
      
      return new Response(
        JSON.stringify({ 
          success: telegramResult.ok, 
          message: "Direct message sent", 
          telegram_response: telegramResult 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Regular flow - get chat ID from user's Telegram connection
    if (!requestData.user_id) {
      console.error("user_id is required");
      return new Response(
        JSON.stringify({ error: "user_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!requestData.notification) {
      console.error("notification is required");
      return new Response(
        JSON.stringify({ error: "notification is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create a Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(`Looking up Telegram connection for user_id: ${requestData.user_id}`);
    
    // Get the user's Telegram chat ID
    const { data: telegramConnection, error: telegramError } = await supabaseAdmin
      .from("user_telegram_connections")
      .select("chat_id")
      .eq("user_id", requestData.user_id)
      .single();

    if (telegramError || !telegramConnection) {
      console.error("Error or no Telegram connection found:", telegramError?.message || "No connection");
      
      // Fallback to hardcoded chat ID if no connection found
      if (requestData.chat_id) {
        console.log(`Falling back to provided chat_id: ${requestData.chat_id}`);
        
        const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const telegramResponse = await fetch(telegramApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: requestData.chat_id,
            text: requestData.notification,
            parse_mode: "HTML",
          }),
        });

        const telegramResult = await telegramResponse.json();
        console.log("Fallback Telegram API response:", JSON.stringify(telegramResult));

        return new Response(
          JSON.stringify({ 
            success: telegramResult.ok, 
            message: "Fallback notification sent", 
            telegram_response: telegramResult 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "No Telegram connection found for this user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    console.log(`Found chat_id: ${telegramConnection.chat_id}`);

    // Send the notification to Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const telegramResponse = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: telegramConnection.chat_id,
        text: requestData.notification,
        parse_mode: "HTML",
      }),
    });

    const telegramResult = await telegramResponse.json();
    console.log("Telegram API response:", JSON.stringify(telegramResult));

    return new Response(
      JSON.stringify({ 
        success: telegramResult.ok, 
        message: "Notification sent", 
        telegram_response: telegramResult 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
