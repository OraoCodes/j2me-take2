
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Define cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Add cors headers to all responses
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    // Handle telegram webhook updates
    if (req.method === 'POST' && new URL(req.url).pathname.includes('/webhook')) {
      console.log('Received webhook update');

      // Parse the incoming webhook body
      const update = await req.json();
      console.log('Webhook update:', JSON.stringify(update));
      
      if (update.message && update.message.text && update.message.text.startsWith('/start')) {
        // Extract the user ID from the /start command (if present)
        const parts = update.message.text.split(' ');
        if (parts.length >= 2) {
          const userId = parts[1];
          const chatId = update.message.chat.id;
          
          console.log(`Processing /start command with userId: ${userId} and chatId: ${chatId}`);
          
          // Store the telegram connection in the database
          const { error } = await supabase
            .from('user_telegram_connections')
            .upsert({ 
              user_id: userId,
              telegram_chat_id: chatId.toString(),
              created_at: new Date().toISOString()
            });
            
          if (error) {
            console.error('Error storing telegram connection:', error);
            // Send error message to user
            await sendTelegramMessage(chatId, 'Sorry, there was an error connecting your Telegram. Please try again.');
            return new Response(JSON.stringify({ success: false, error: error.message }), { headers });
          }
          
          // Send success message to user
          await sendTelegramMessage(
            chatId, 
            '✅ <b>Success!</b> Your Telegram is now connected to your Gebeya Services account. You will receive notifications here when you get new service requests.'
          );
          
          return new Response(JSON.stringify({ success: true }), { headers });
        } else {
          const chatId = update.message.chat.id;
          // Send message explaining how to connect properly
          await sendTelegramMessage(
            chatId,
            'Please connect to your account through the "Connect Telegram" button in your Gebeya Services dashboard.'
          );
        }
      }
      
      // Default response for other webhook events
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
    
    // Handle notification sending from the frontend
    if (req.method === 'POST') {
      const { user_id, notification } = await req.json();
      
      console.log(`Received notification request for user: ${user_id}`);
      console.log(`Notification content: ${notification}`);
      
      if (!user_id || !notification) {
        console.error('Missing required fields: user_id or notification');
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields: user_id or notification' }),
          { headers, status: 400 }
        );
      }
      
      // Get the telegram chat id for this user
      const { data: connectionData, error: connectionError } = await supabase
        .from('user_telegram_connections')
        .select('telegram_chat_id')
        .eq('user_id', user_id)
        .single();
        
      if (connectionError || !connectionData) {
        console.error('Error fetching telegram connection or user not connected:', connectionError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'User not connected to Telegram or error fetching connection',
            details: connectionError 
          }),
          { headers, status: 404 }
        );
      }
      
      const chatId = connectionData.telegram_chat_id;
      console.log(`Found chat ID: ${chatId} for user: ${user_id}`);
      
      // Send the notification to telegram
      const sendResult = await sendTelegramMessage(chatId, notification);
      
      return new Response(
        JSON.stringify({ 
          success: sendResult.ok, 
          details: sendResult 
        }),
        { headers }
      );
    }
    
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers, status: 405 }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers, status: 500 }
    );
  }
});

async function sendTelegramMessage(chatId: string | number, message: string): Promise<any> {
  if (!telegramBotToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not set' };
  }
  
  console.log(`Sending telegram message to chat ID: ${chatId}`);
  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }),
    });
    
    const result = await response.json();
    console.log('Telegram API response:', JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error sending telegram message:', error);
    return { ok: false, error: error.message };
  }
}
