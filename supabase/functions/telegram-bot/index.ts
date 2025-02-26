import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const CHAT_ID = "7318715212";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const conversationHistory = new Map<string, Message[]>();
const MAX_HISTORY_LENGTH = 10;

function updateHistory(chatId: string, message: Message) {
  if (!conversationHistory.has(chatId)) {
    conversationHistory.set(chatId, []);
  }
  
  const history = conversationHistory.get(chatId)!;
  history.push(message);
  
  if (history.length > MAX_HISTORY_LENGTH) {
    history.shift();
  }
  
  conversationHistory.set(chatId, history);
}

function getHistory(chatId: string): Message[] {
  return conversationHistory.get(chatId) || [];
}

function generateBookingResponse(message: string, context: { history: Message[] } = { history: [] }): string {
  const history = context.history;
  const isFirstMessage = history.length === 0;

  const hasProvidedService = history.some(msg => 
    msg.role === 'user' && 
    (msg.content.toLowerCase().includes('training') || 
     msg.content.toLowerCase().includes('assessment') || 
     msg.content.toLowerCase().includes('meal'))
  );

  const hasProvidedDate = history.some(msg => 
    msg.role === 'user' && 
    (msg.content.toLowerCase().includes('tomorrow') || 
     msg.content.toLowerCase().includes('next') || 
     /\d{1,2}(st|nd|rd|th)/.test(msg.content))
  );

  const hasProvidedContact = history.some(msg => 
    msg.role === 'user' && 
    (/\d{10}/.test(msg.content) || msg.content.toLowerCase().includes('phone'))
  );

  const lowerMessage = message.toLowerCase();
  
  if (isFirstMessage) {
    return "Habari! I'm Wairimu, Kevin's AI assistant. I'm here to help you schedule appointments and answer any questions about our services. How can I assist you today?";
  }

  if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    let response = "I can help you schedule an appointment with Kevin!";
    
    if (!hasProvidedService) {
      response += "\n\nWhich service are you interested in? We offer:\n" +
                 "   • 1-on-1 Personal Training (KSH 3,000)\n" +
                 "   • Virtual Training Sessions (KSH 2,000)\n" +
                 "   • Body Composition Assessment (KSH 1,500)\n" +
                 "   • Custom Meal Planning (KSH 2,500)";
    }
    
    if (!hasProvidedDate) {
      response += "\n\nWhat's your preferred date and time? Kevin's working hours are Monday-Saturday, 9 AM to 5 PM.";
    }
    
    if (!hasProvidedContact && (hasProvidedService || hasProvidedDate)) {
      response += "\n\nCould you please provide your contact number for confirmation?";
    }
    
    if (hasProvidedService && hasProvidedDate && hasProvidedContact) {
      response = "Great! I have all the information needed. Let me check Kevin's availability and confirm your appointment.";
    }
    
    return response;
  }
  
  if (lowerMessage.includes('cancel') || lowerMessage.includes('reschedule')) {
    return "I understand you'd like to modify your appointment. To help you with that, please provide:\n\n" +
           "1. Your current appointment date and time\n" +
           "2. Your name and contact number\n" +
           "3. For rescheduling, your preferred new date and time\n\n" +
           "I'll check Kevin's availability and help you make the necessary changes.";
  }
  
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
    return "Here are our current service rates:\n\n" +
           "🏋️ 1-on-1 Personal Training:\n" +
           "• Single Session: KSH 3,000\n" +
           "• 4-Session Package: KSH 10,000\n\n" +
           "💻 Virtual Training:\n" +
           "• Live Session: KSH 2,000\n" +
           "• 8-Week Home Program: KSH 15,000\n\n" +
           "📊 Assessments & Planning:\n" +
           "• Body Composition Assessment: KSH 1,500\n" +
           "• Custom Meal Plan: KSH 2,500\n\n" +
           "Would you like to schedule any of these services?";
  }
  
  if (lowerMessage.includes('available') || lowerMessage.includes('free') || lowerMessage.includes('when')) {
    return "I'll help you find the best available time slot. Kevin's regular hours are:\n\n" +
           "Monday - Saturday: 9:00 AM - 5:00 PM\n" +
           "Sunday: Closed\n\n" +
           "To check specific availability, please let me know:\n" +
           "1. Which service you're interested in\n" +
           "2. Your preferred date or dates\n\n" +
           "I'll find the earliest available slot that works for you!";
  }

  return "I'm Wairimu, Kevin's AI assistant. Based on our conversation, how else can I help you with:\n\n" +
         "🗓️ Scheduling appointments\n" +
         "💰 Service pricing information\n" +
         "📅 Checking availability\n" +
         "🔄 Managing existing bookings";
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Bot received request');
    
    const { message } = await req.json();
    
    if (!message?.text) {
      throw new Error('No message text provided');
    }

    updateHistory(CHAT_ID, { role: 'user', content: message.text });

    const history = getHistory(CHAT_ID);
    console.log('Conversation history:', history);

    const botResponse = generateBookingResponse(message.text, { history });

    updateHistory(CHAT_ID, { role: 'assistant', content: botResponse });

    const telegramResponse = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: botResponse,
      }),
    });

    if (!telegramResponse.ok) {
      const error = await telegramResponse.text();
      console.error('Telegram API error:', error);
      throw new Error('Failed to send message to Telegram');
    }

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

async function getServices() {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/services?select=*`, {
    headers: {
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    }
  });
  return await response.json();
}

async function getAvailability() {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/availability_settings?select=*`, {
    headers: {
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    }
  });
  return await response.json();
}

async function getServiceRequests() {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/service_requests?select=*`, {
    headers: {
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    }
  });
  return await response.json();
}

async function getBlockedDates() {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/blocked_dates?select=*`, {
    headers: {
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    }
  });
  return await response.json();
}
