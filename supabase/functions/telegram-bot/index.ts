
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const USER_ID = "66ac5e44-5b18-4883-b323-b13cd0280046";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
    from?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
  };
}

async function fetchServices(userId: string) {
  const { data: services } = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/services?user_id=eq.${userId}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      },
    }
  ).then(res => res.json());
  return services;
}

async function fetchAvailability(userId: string) {
  const { data: availability } = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/availability_settings?user_id=eq.${userId}&select=*`,
    {
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      },
    }
  ).then(res => res.json());
  return availability;
}

async function createServiceRequest(serviceId: string, userId: string, customerInfo: any) {
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/rest/v1/service_requests`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        apikey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        user_id: userId,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        notes: customerInfo.notes,
        status: 'pending',
      }),
    }
  );
  return response.ok;
}

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
}

async function getAIResponse(userMessage: string, context: any) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant managing service bookings. Here's the context:
          Available Services: ${JSON.stringify(context.services)}
          Availability: ${JSON.stringify(context.availability)}
          
          Help users book services, check availability, and provide information about the services.
          Be concise but friendly. If they want to book, ask for their name and phone number.`,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', update);

    if (!update.message?.chat.id || !update.message.text) {
      return new Response('Invalid update', { status: 400 });
    }

    const services = await fetchServices(USER_ID);
    const availability = await fetchAvailability(USER_ID);

    const aiResponse = await getAIResponse(update.message.text, {
      services,
      availability,
    });

    await sendTelegramMessage(update.message.chat.id, aiResponse);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
