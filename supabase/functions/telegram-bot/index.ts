import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, parse, isWithinInterval, set, parseISO, addHours } from 'https://esm.sh/date-fns@2';

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
    voice?: {
      file_id: string;
    };
  };
}

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

interface ServiceRequest {
  scheduled_at: string;
  status: string;
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

async function fetchServiceRequests(userId: string): Promise<ServiceRequest[]> {
  console.log('Fetching service requests for user:', userId);
  const { data, error } = await supabase
    .from('service_requests')
    .select('scheduled_at, status')
    .eq('user_id', userId)
    .in('status', ['pending', 'accepted']);

  if (error) {
    console.error('Error fetching service requests:', error);
    throw error;
  }

  console.log('Service requests fetched:', data);
  return data || [];
}

async function fetchBlockedDates(userId: string) {
  console.log('Fetching blocked dates for user:', userId);
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching blocked dates:', error);
    throw error;
  }

  console.log('Blocked dates fetched:', data);
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

async function downloadVoiceMessage(fileId: string): Promise<ArrayBuffer> {
  // First, get the file path
  const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
  const filePathResponse = await fetch(getFileUrl);
  const fileData = await filePathResponse.json();

  if (!fileData.ok) {
    throw new Error('Failed to get voice file path');
  }

  // Download the file
  const filePath = fileData.result.file_path;
  const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  const fileResponse = await fetch(downloadUrl);
  return await fileResponse.arrayBuffer();
}

async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  // Convert ArrayBuffer to Blob
  const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg' });
  
  // Create FormData and append the audio file
  const formData = new FormData();
  formData.append('file', audioBlob, 'voice.ogg');
  formData.append('model', 'whisper-1');

  // Send to OpenAI's Whisper API
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }

  const result = await response.json();
  return result.text;
}

function formatAvailabilityForDate(date: Date, availability: any[], serviceRequests: ServiceRequest[], blockedDates: any[]) {
  // Check if date is blocked
  const isDateBlocked = blockedDates.some(bd => 
    format(parseISO(bd.blocked_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
  );
  
  if (isDateBlocked) {
    return `${format(date, 'MMMM d, yyyy')} is fully booked or blocked.`;
  }

  const dayOfWeek = date.getDay();
  const daySetting = availability.find(a => a.day_of_week === dayOfWeek);
  
  if (!daySetting?.is_available) {
    return `${format(date, 'MMMM d, yyyy')} (${format(date, 'EEEE')}) is not a working day.`;
  }

  // Get all booked slots for this date
  const dayBookings = serviceRequests.filter(req => {
    const bookingDate = parseISO(req.scheduled_at);
    return format(bookingDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  });

  // Generate available time slots
  const startTime = parse(daySetting.start_time, 'HH:mm:ss', date);
  const endTime = parse(daySetting.end_time, 'HH:mm:ss', date);
  const availableSlots: string[] = [];

  let currentSlot = startTime;
  while (currentSlot < endTime) {
    const slotEnd = addHours(currentSlot, 1);
    
    const isBooked = dayBookings.some(booking => {
      const bookingTime = parseISO(booking.scheduled_at);
      return isWithinInterval(bookingTime, { start: currentSlot, end: slotEnd });
    });

    if (!isBooked) {
      availableSlots.push(format(currentSlot, 'h:mm a'));
    }
    
    currentSlot = slotEnd;
  }

  if (availableSlots.length === 0) {
    return `${format(date, 'MMMM d, yyyy')} is fully booked.`;
  }

  return `Available slots for ${format(date, 'MMMM d, yyyy')}:\n${availableSlots.join('\n')}`;
}

async function getAIResponse(userMessage: string, context: { 
  services: Service[], 
  availability: any[],
  serviceRequests: ServiceRequest[],
  blockedDates: any[]
}) {
  console.log('Getting AI response with context:', context);
  
  const servicesInfo = context.services.map(service => 
    `${service.name} - ${service.price} KES${service.description ? ` (${service.description})` : ''}`
  ).join('\n');

  // Generate availability info for next 7 days
  const availabilityInfo = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return formatAvailabilityForDate(date, context.availability, context.serviceRequests, context.blockedDates);
  }).join('\n\n');

  const prompt = `
    You are Wairimu, Kevin's AI assistant who helps manage appointments and answer questions about his services. Your personality is:
    - Professional yet friendly and approachable
    - Helpful and efficient
    - Can communicate in English, Swahili, and Sheng (respond in the same language the user uses)
    - Always introduces yourself as "Wairimu, Kevin's AI assistant" when meeting someone new
    - When asked about services, you MUST list all available services with their complete details
    - When discussing availability, be very precise about available time slots
    
    Available services:
    ${servicesInfo || 'No services available at the moment.'}
    
    Availability for the next 7 days:
    ${availabilityInfo}
    
    User message: ${userMessage}
    
    Important guidelines:
    1. If the user asks for services, list ALL available services with complete details
    2. When suggesting appointments, ONLY suggest times that are listed as available above
    3. Match the user's language (English/Swahili/Sheng)
    4. Maintain a helpful, professional, yet friendly tone
    5. If all slots are booked for a requested time, clearly communicate this and suggest alternative times
    6. If services are not available, politely inform the user and ask what type of services they're looking for
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
    return "Samahani, nina shida kidogo kwa sasa. Tafadhali jaribu tena baadaye. (I apologize, but I'm having trouble at the moment. Please try again later.)";
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', update);

    if (!update.message?.chat.id) {
      return new Response('Invalid update', { status: 400 });
    }

    let userMessage: string;

    if (update.message.voice) {
      try {
        console.log('Processing voice message...');
        const audioBuffer = await downloadVoiceMessage(update.message.voice.file_id);
        userMessage = await transcribeAudio(audioBuffer);
        console.log('Transcribed text:', userMessage);
      } catch (error) {
        console.error('Error processing voice message:', error);
        await sendTelegramMessage(
          update.message.chat.id,
          "Samahani, sikuweza kusikia vizuri ujumbe wako wa sauti. Tafadhali jaribu tena. (Sorry, I couldn't process your voice message. Please try again.)"
        );
        return new Response('OK', { status: 200 });
      }
    } else if (update.message.text) {
      userMessage = update.message.text;
    } else {
      return new Response('Invalid message format', { status: 400 });
    }

    const services = await fetchServices(USER_ID);
    const availability = await fetchAvailability(USER_ID);
    const serviceRequests = await fetchServiceRequests(USER_ID);
    const blockedDates = await fetchBlockedDates(USER_ID);

    console.log('Context for AI:', { services, availability, serviceRequests, blockedDates });

    const aiResponse = await getAIResponse(userMessage, {
      services,
      availability,
      serviceRequests,
      blockedDates
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
