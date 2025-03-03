
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

interface NotificationRequest {
  user_id?: string;
  chat_id?: string;
  notification: string;
  direct_message?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, chat_id, notification, direct_message } = await req.json() as NotificationRequest;
    
    // Log the received request data for debugging
    console.log("Received notification request:", { user_id, chat_id, notification, direct_message });
    
    if (!TELEGRAM_BOT_TOKEN) {
      console.error("TELEGRAM_BOT_TOKEN is not set");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Telegram bot token not configured" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    let targetChatId = chat_id;

    // If a chat_id is not directly provided and direct_message is not true, 
    // try to look up the chat_id for the user_id
    if (!targetChatId && !direct_message && user_id) {
      try {
        // Create a Supabase client for this request
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.6");
        
        const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
        
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Look up the telegram_chat_id for this user
        const { data, error } = await supabase
          .from('profiles')
          .select('telegram_chat_id')
          .eq('id', user_id)
          .single();

        if (error) {
          console.error("Error fetching chat_id from profiles:", error);
          throw error;
        }

        if (data?.telegram_chat_id) {
          targetChatId = data.telegram_chat_id;
          console.log(`Found chat_id ${targetChatId} for user_id ${user_id}`);
        } else {
          console.log(`No telegram_chat_id found for user_id ${user_id}`);
        }
      } catch (lookupError) {
        console.error("Error looking up chat ID:", lookupError);
      }
    }

    // If we still don't have a target chat ID, try the hardcoded fallback
    if (!targetChatId) {
      targetChatId = "7318715212"; // Fallback to hardcoded chat ID
      console.log(`Using fallback chat_id: ${targetChatId}`);
    }

    // Send the message to Telegram
    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: notification,
        parse_mode: 'HTML',
      }),
    });

    const telegramResult = await telegramResponse.json();
    
    console.log("Telegram API response:", telegramResult);

    if (!telegramResponse.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(telegramResult)}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        telegram_response: telegramResult 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || String(error) 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
