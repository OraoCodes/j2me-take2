
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get env variables
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
      const { user_id, notification } = await req.json();
      
      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Look up the telegram chat_id for this user
      const { data: connection, error: connectionError } = await supabase
        .from('user_telegram_connections')
        .select('telegram_chat_id')
        .eq('user_id', user_id)
        .single();

      if (connectionError || !connection) {
        console.error('Error fetching telegram connection:', connectionError);
        return new Response(
          JSON.stringify({ error: "No Telegram connection found for this user" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
        );
      }

      // Send message via Telegram
      const chatId = connection.telegram_chat_id;
      const telegramResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: notification,
            parse_mode: 'HTML',
          }),
        }
      );

      const telegramResult = await telegramResponse.json();
      console.log('Telegram API response:', telegramResult);

      return new Response(
        JSON.stringify({ success: true, telegram_response: telegramResult }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (req.method === 'GET') {
      // This handles Telegram webhook updates
      const url = new URL(req.url);
      const startParameter = url.searchParams.get('start');
      
      if (startParameter) {
        // This is a deep link from Telegram to connect a user
        try {
          const userId = startParameter;
          
          // Get the chat ID from the request
          const chatId = url.searchParams.get('chat_id');
          
          if (!chatId) {
            return new Response(
              JSON.stringify({ error: "chat_id parameter is required" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
          }
          
          // Store the connection in the database
          const { data, error } = await supabase
            .from('user_telegram_connections')
            .upsert({
              user_id: userId,
              telegram_chat_id: parseInt(chatId),
              connected_at: new Date().toISOString()
            })
            .select();
            
          if (error) {
            console.error('Error creating telegram connection:', error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
            );
          }
          
          return new Response(
            JSON.stringify({ success: true, data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.error('Error processing start parameter:', err);
          return new Response(
            JSON.stringify({ error: "Invalid start parameter format" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
      }
      
      return new Response(
        JSON.stringify({ message: "Telegram bot endpoint is working" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
