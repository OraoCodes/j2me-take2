
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define interfaces for better type checking
interface TelegramUpdateInterface {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    entities?: { type: string; offset: number; length: number }[];
  };
}

interface ServiceRequestNotificationInterface {
  user_id: string;
  notification: string;
}

// Handle the Telegram webhook and notification requests
serve(async (req) => {
  try {
    const url = new URL(req.url);
    const body = await req.json();

    console.log("Request path:", url.pathname);
    console.log("Request body:", JSON.stringify(body, null, 2));

    // Handle notification requests from frontend
    if (body.notification && body.user_id) {
      return await handleNotificationRequest(body as ServiceRequestNotificationInterface);
    }

    // Handle Telegram webhook updates
    if (body.update_id) {
      return await handleTelegramUpdate(body as TelegramUpdateInterface);
    }

    // Default response for unrecognized requests
    return new Response(
      JSON.stringify({ message: "Invalid request format" }),
      { headers: { "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Handle Telegram webhook updates (bot messages)
async function handleTelegramUpdate(update: TelegramUpdateInterface) {
  if (!update.message || !update.message.text) {
    return new Response(
      JSON.stringify({ message: "No message text found" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const { message } = update;
  const chatId = message.chat.id;
  
  // Check if this is a /start command with a user ID parameter
  if (message.text.startsWith('/start ')) {
    const userId = message.text.split(' ')[1];
    
    if (userId) {
      try {
        // Store the connection between user_id and telegram_chat_id
        const { data, error } = await supabase
          .from('user_telegram_connections')
          .upsert(
            { 
              user_id: userId, 
              telegram_chat_id: chatId,
              connected_at: new Date().toISOString()
            },
            { onConflict: 'user_id' }
          );

        if (error) throw error;
        
        // Send confirmation message to the user
        await sendTelegramMessage(
          chatId,
          "✅ Your Gebeya Service account has been successfully connected to Telegram! You'll now receive notifications for new service requests."
        );

        return new Response(
          JSON.stringify({ success: true, message: "Telegram connection saved" }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("Error saving telegram connection:", error);
        
        await sendTelegramMessage(
          chatId,
          "❌ There was an error connecting your account. Please try again or contact support."
        );

        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { "Content-Type": "application/json" }, status: 500 }
        );
      }
    }
  }

  // Default response for other messages
  await sendTelegramMessage(
    chatId,
    "Welcome to Gebeya Service Bot! To connect your account, please use the link from your service dashboard."
  );

  return new Response(
    JSON.stringify({ message: "Message processed" }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// Handle notification requests from the frontend
async function handleNotificationRequest(data: ServiceRequestNotificationInterface) {
  try {
    const { user_id, notification } = data;

    // Fetch the user's telegram chat ID
    const { data: connection, error } = await supabase
      .from('user_telegram_connections')
      .select('telegram_chat_id')
      .eq('user_id', user_id)
      .single();

    if (error || !connection) {
      console.error("Error fetching telegram connection:", error);
      return new Response(
        JSON.stringify({ error: "No Telegram connection found for this user" }),
        { headers: { "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Send the notification to Telegram
    const result = await sendTelegramMessage(
      connection.telegram_chat_id,
      notification,
      { parse_mode: "HTML" }
    );

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// Helper function to send messages to Telegram
async function sendTelegramMessage(
  chat_id: number,
  text: string,
  options: { parse_mode?: string } = {}
) {
  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id,
      text,
      ...options
    }),
  });

  return await response.json();
}
