
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const USER_ID = "66ac5e44-5b18-4883-b323-b13cd0280046";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TelegramUpdate {
  message?: {
    chat: {
      id: number;
    };
    text?: string;
  };
}

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

async function fetchServices(userId: string): Promise<Service[]> {
  console.log('Fetching services for user:', userId);
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching services:', error);
    throw error;
  }

  console.log('Services fetched:', data);
  return data || [];
}

async function fetchAvailability(userId: string) {
  console.log('Fetching availability for user:', userId);
  const { data, error } = await supabase
    .from('availability_settings')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }

  console.log('Availability fetched:', data);
  return data || [];
}

async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }
}

async function getAIResponse(userMessage: string, context: { services: Service[], availability: any[] }) {
  console.log('Getting AI response with context:', context);
  
  // Create a context string that includes information about services and availability
  const servicesInfo = context.services.map(service => 
    `${service.name} - ${service.price} KES${service.description ? ` (${service.description})` : ''}`
  ).join('\n');

  const availabilityInfo = context.availability
    .filter(a => a.is_available)
    .map(a => `${a.day_of_week}: ${a.start_time} - ${a.end_time}`)
    .join('\n');

  const prompt = `
    You are a helpful assistant managing appointments and inquiries for a service business.
    Available services:
    ${servicesInfo || 'No services available at the moment.'}
    
    Business hours:
    ${availabilityInfo || 'Business hours not set.'}
    
    User message: ${userMessage}
    
    Please provide a helpful response based on the available services and business hours.
    If services are not available, kindly inform the user and ask what type of services they're looking for.
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('AI response:', data);
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I apologize, but I'm having trouble processing your request at the moment. Please try again later.";
  }
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

    console.log('Context for AI:', { services, availability });

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
