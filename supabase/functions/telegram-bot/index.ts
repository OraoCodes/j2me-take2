
import { createClient } from '@supabase/supabase-js';
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables are not set');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const { url, method, update, user_id, notification } = await req.json();

    // Handle sending service request notifications
    if (notification && user_id) {
      console.log(`Sending notification to user ${user_id}:`, notification);
      
      // Get the user's telegram chat ID
      const { data: userTelegram, error: userError } = await supabase
        .from('user_telegram_connections')
        .select('telegram_chat_id')
        .eq('user_id', user_id)
        .single();
      
      if (userError || !userTelegram?.telegram_chat_id) {
        console.error('Error fetching user telegram connection:', userError);
        return new Response(
          JSON.stringify({ success: false, error: 'User not connected to Telegram' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Send message to the user via Telegram
      const message = typeof notification === 'string' 
        ? notification 
        : JSON.stringify(notification);
        
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userTelegram.telegram_chat_id,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );
      
      const result = await response.json();
      console.log('Telegram send result:', result);
      
      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle webhook updates from Telegram
    if (update) {
      console.log('Received update from Telegram:', update);
      
      // Process messages
      if (update.message) {
        const chatId = update.message.chat.id;
        const messageText = update.message.text;
        
        if (messageText?.startsWith('/start')) {
          const parts = messageText.split(' ');
          if (parts.length > 1) {
            const userId = parts[1];
            console.log(`Connecting user ${userId} to Telegram chat ${chatId}`);
            
            // Store the connection between Supabase user and Telegram chat
            const { error } = await supabase
              .from('user_telegram_connections')
              .upsert({ 
                user_id: userId, 
                telegram_chat_id: chatId, 
                connected_at: new Date().toISOString() 
              });
              
            if (error) {
              console.error('Error storing Telegram connection:', error);
              // Send error message to user
              await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: 'Error connecting your account. Please try again later.',
                  }),
                }
              );
            } else {
              // Send success message to user
              await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: 'Your account has been successfully connected! You will now receive notifications for new service requests.',
                  }),
                }
              );
            }
          } else {
            // Just /start command without user ID
            await fetch(
              `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: 'Welcome to the Service Notification Bot! Please use the link provided from the app to connect your account.',
                }),
              }
            );
          }
        }
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Setup webhook endpoint
    if (url && method === 'setWebhook') {
      console.log(`Setting webhook URL to: ${url}`);
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        }
      );
      
      const result = await response.json();
      console.log('Webhook setup result:', result);
      
      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default response for unhandled requests
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in Telegram bot function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
