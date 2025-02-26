
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = "7318715212";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate booking assistance response
function generateBookingResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    return "I can help you with booking! To schedule an appointment, please provide:\n" +
           "1. Your preferred date and time\n" +
           "2. The service you're interested in\n" +
           "3. Your contact number\n\n" +
           "I'll assist you with confirming availability and setting up the appointment.";
  }
  
  if (lowerMessage.includes('cancel') || lowerMessage.includes('reschedule')) {
    return "To cancel or reschedule your appointment, please provide your booking reference number " +
           "or the date and time of your existing appointment. I'll help you make the necessary changes.";
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
    return "I'll be happy to provide you with pricing information. Could you please specify which service " +
           "you're interested in? I can then give you detailed pricing and any current special offers.";
  }
  
  if (lowerMessage.includes('available') || lowerMessage.includes('free')) {
    return "I can check availability for you. Please let me know:\n" +
           "1. Which service you're interested in\n" +
           "2. Your preferred date or dates\n" +
           "I'll check the calendar and find the best available time slots for you.";
  }

  // Default response for other queries
  return "Hi! I'm your booking assistant. I can help you with:\n" +
         "• Scheduling appointments\n" +
         "• Checking service pricing\n" +
         "• Checking availability\n" +
         "• Managing your bookings\n\n" +
         "Just let me know what you'd like to do!";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Bot received request');
    
    const { message } = await req.json();
    
    if (!message?.text) {
      throw new Error('No message text provided');
    }

    // Generate appropriate response based on message content
    const botResponse = generateBookingResponse(message.text);

    // First, send the customer message to Telegram
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `💬 Customer: ${message.text}`,
      }),
    });

    // Then, send the bot's response to Telegram
    const telegramResponse = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `🤖 Bot Response: ${botResponse}`,
      }),
    });

    if (!telegramResponse.ok) {
      const error = await telegramResponse.text();
      console.error('Telegram API error:', error);
      throw new Error('Failed to send message to Telegram');
    }

    // Send response back to web client
    console.log('Sending response:', botResponse);

    return new Response(
      JSON.stringify({ text: botResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in telegram-bot function:', error);
    return new Response(
      JSON.stringify({ 
        text: "Sorry, I encountered an error. Please try again." 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
