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

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface BookingSession {
  step: 'service' | 'date' | 'time' | 'name' | 'phone' | 'email' | 'confirm';
  serviceId?: string;
  scheduledAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

// Track booking sessions and conversation history by chat ID
const bookingSessions = new Map<number, BookingSession>();
const conversationHistory = new Map<number, Message[]>();

// Maximum number of messages to keep in history
const MAX_HISTORY = 30;

function addToHistory(chatId: number, message: Message) {
  const history = conversationHistory.get(chatId) || [];
  history.push(message);
  
  // Keep only the last MAX_HISTORY messages
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  
  conversationHistory.set(chatId, history);
}

async function downloadVoiceMessage(fileId: string): Promise<ArrayBuffer> {
  console.log('Downloading voice message...');
  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;

  const response = await fetch(telegramApiUrl);
  const result = await response.json();

  if (!result.ok) {
    console.error('Telegram API error:', result);
    throw new Error(`Telegram API error: ${result.description}`);
  }

  const filePath = result.result.file_path;
  const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

  const fileResponse = await fetch(fileUrl);
  if (!fileResponse.ok) {
    console.error('Error downloading file:', fileResponse.status, fileResponse.statusText);
    throw new Error(`Error downloading file: ${fileResponse.statusText}`);
  }

  return await fileResponse.arrayBuffer();
}

async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  console.log('Transcribing audio...');
  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: 'audio/ogg' });
  formData.append('file', blob, 'audio.ogg');
  formData.append('model', 'whisper-1');

  const openaiUrl = 'https://api.openai.com/v1/audio/transcriptions';
  const openaiResponse = await fetch(openaiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  const openaiResult = await openaiResponse.json();

  if (openaiResult.error) {
    console.error('OpenAI error:', openaiResult);
    throw new Error(`OpenAI error: ${openaiResult.error.message}`);
  }

  return openaiResult.text;
}

async function sendTelegramMessage(chatId: number, text: string) {
  console.log('Sending Telegram message:', text);
  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(telegramApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });

  const result = await response.json();

  if (!result.ok) {
    console.error('Telegram API error:', result);
    throw new Error(`Telegram API error: ${result.description}`);
  }
}

async function fetchServices(userId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data;
}

async function fetchAvailability(userId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from('availability_settings')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching availability:', error);
    return [];
  }

  return data;
}

async function fetchServiceRequests(userId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching service requests:', error);
    return [];
  }

  return data;
}

async function fetchBlockedDates(userId: string) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('user_id', userId);
  
    if (error) {
      console.error('Error fetching blocked dates:', error);
      return [];
    }
  
    return data;
  }

async function createServiceRequest(booking: BookingSession, chatId: number) {
  if (!booking.serviceId || !booking.scheduledAt || !booking.customerName || !booking.customerPhone) {
    throw new Error('Missing required booking information');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase
    .from('service_requests')
    .insert({
      service_id: booking.serviceId,
      user_id: USER_ID,
      customer_name: booking.customerName,
      customer_phone: booking.customerPhone,
      customer_email: booking.customerEmail,
      scheduled_at: booking.scheduledAt,
      status: 'pending'
    });

  if (error) throw error;
  
  // Clear the booking session
  bookingSessions.delete(chatId);
}

async function handleBookingStep(chatId: number, userMessage: string) {
  let session = bookingSessions.get(chatId) || { step: 'service' };
  let response = '';

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  switch (session.step) {
    case 'service':
      // Find service by name or ask for clarification
      const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', USER_ID);
      
      const service = services?.find(s => 
        s.name.toLowerCase().includes(userMessage.toLowerCase())
      );

      if (service) {
        session.serviceId = service.id;
        session.step = 'date';
        response = "Great! What date would you like to book? (Please use format DD/MM/YYYY)";
      } else {
        response = "I couldn't find that service. Please choose from these available services:\n" +
          services?.map(s => `- ${s.name}`).join('\n');
      }
      break;

    case 'date':
      try {
        const [day, month, year] = userMessage.split('/').map(Number);
        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        
        session.scheduledAt = date.toISOString();
        session.step = 'time';
        response = "What time would you prefer? (Please use 24-hour format, e.g., 14:00)";
      } catch {
        response = "Sorry, I didn't understand that date. Please use the format DD/MM/YYYY (e.g., 27/02/2025)";
      }
      break;

    case 'time':
      try {
        const [hours, minutes] = userMessage.split(':').map(Number);
        const date = new Date(session.scheduledAt!);
        date.setHours(hours, minutes, 0, 0);
        
        session.scheduledAt = date.toISOString();
        session.step = 'name';
        response = "Please provide your full name:";
      } catch {
        response = "Sorry, I didn't understand that time. Please use 24-hour format (e.g., 14:00)";
      }
      break;

    case 'name':
      session.customerName = userMessage;
      session.step = 'phone';
      response = "Please provide your phone number:";
      break;

    case 'phone':
      session.customerPhone = userMessage;
      session.step = 'email';
      response = "Please provide your email address (or type 'skip' to skip):";
      break;

    case 'email':
      if (userMessage.toLowerCase() !== 'skip') {
        session.customerEmail = userMessage;
      }
      session.step = 'confirm';
      
      // Show booking summary
      response = `Please confirm your booking details:\n\n` +
        `Date: ${format(parseISO(session.scheduledAt!), 'PPP p')}\n` +
        `Name: ${session.customerName}\n` +
        `Phone: ${session.customerPhone}\n` +
        `Email: ${session.customerEmail || 'Not provided'}\n\n` +
        `Reply with 'confirm' to book or 'cancel' to start over.`;
      break;

    case 'confirm':
      if (userMessage.toLowerCase() === 'confirm') {
        try {
          await createServiceRequest(session, chatId);
          response = "Your booking has been confirmed! Kevin will review it shortly and get back to you.";
        } catch (error) {
          console.error('Booking error:', error);
          response = "Sorry, there was an error creating your booking. Please try again.";
          bookingSessions.delete(chatId);
        }
      } else if (userMessage.toLowerCase() === 'cancel') {
        bookingSessions.delete(chatId);
        response = "Booking cancelled. How else can I help you?";
      } else {
        response = "Please reply with 'confirm' to book or 'cancel' to start over.";
      }
      break;
  }

  bookingSessions.set(chatId, session);
  return response;
}

async function getAIResponse(userMessage: string, context: { 
  services: any[], 
  availability: any[],
  serviceRequests: any[],
  blockedDates: any[]
}, chatId: number) {
  // Add user message to history
  addToHistory(chatId, {
    role: 'user',
    content: userMessage,
    timestamp: Date.now()
  });

  // Check if there's an ongoing booking session
  const bookingSession = bookingSessions.get(chatId);
  if (bookingSession) {
    const response = await handleBookingStep(chatId, userMessage);
    // Add assistant's response to history
    addToHistory(chatId, {
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });
    return response;
  }

  // If message contains booking intent, start a booking session
  if (userMessage.toLowerCase().includes('book') || 
      userMessage.toLowerCase().includes('schedule') ||
      userMessage.toLowerCase().includes('appointment')) {
    bookingSessions.set(chatId, { step: 'service' });
    const servicesInfo = context.services
      .map(service => `- ${service.name}`)
      .join('\n');
    const response = `I'll help you book an appointment. Which service would you like to book?\n\nAvailable services:\n${servicesInfo}`;
    
    // Add assistant's response to history
    addToHistory(chatId, {
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });
    return response;
  }

  const history = conversationHistory.get(chatId) || [];
  
  // Generate availability info
  const availabilityInfo = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return formatAvailabilityForDate(date, context.availability, context.serviceRequests, context.blockedDates);
  }).join('\n\n');

  const servicesInfo = context.services.map(service => 
    `${service.name} - ${service.price} KES${service.description ? ` (${service.description})` : ''}`
  ).join('\n');

  const systemPrompt = `
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
    
    Previous conversation context:
    ${history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}
    
    Current user message: ${userMessage}
    
    Important guidelines:
    1. If the user asks for services, list ALL available services with complete details
    2. When suggesting appointments, ONLY suggest times that are listed as available above
    3. Match the user's language (English/Swahili/Sheng)
    4. Maintain a helpful, professional, yet friendly tone
    5. If all slots are booked for a requested time, clearly communicate this and suggest alternative times
    6. If services are not available, politely inform the user and ask what type of services they're looking for
    7. Use the conversation history to maintain context and provide more personalized responses
    8. Reference previous interactions when relevant
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Add assistant's response to history
    addToHistory(chatId, {
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    });

    return aiResponse;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "Samahani, nina shida kidogo kwa sasa. Tafadhali jaribu tena baadaye. (I apologize, but I'm having trouble at the moment. Please try again later.)";
  }
}

function formatAvailabilityForDate(date: Date, availability: any[], serviceRequests: any[], blockedDates: any[]) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const availabilityForDay = availability.find(a => a.day_of_week === dayOfWeek);
  const serviceRequestsForDay = serviceRequests.filter(r => r.scheduled_at && new Date(r.scheduled_at).toLocaleDateString('en-US', { weekday: 'long' }) === dayOfWeek);
  const blockedDate = blockedDates.find(d => d.blocked_date === `${year}-${month}-${dayOfMonth}`);

  let availabilityString = '';
  if (availabilityForDay) {
    availabilityString = availabilityForDay.start_time + ' - ' + availabilityForDay.end_time;
  } else {
    availabilityString = 'Not available';
  }

  if (serviceRequestsForDay.length > 0) {
    availabilityString += ' (Booked)';
  }

  if (blockedDate) {
    availabilityString += ' (Blocked)';
  }

  return `${dayOfWeek}, ${dayOfMonth}/${month}/${year}: ${availabilityString}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const update: any = await req.json();
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
          "Samahani, sikuweza kusikia vizuri ujumbe wako wa sauti. Tafadhali jaribu tena."
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
    }, update.message.chat.id);

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
