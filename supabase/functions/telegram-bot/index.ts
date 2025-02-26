
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, parse, isWithinInterval, set, parseISO, addHours, isSameDay, startOfDay, endOfDay, addDays } from 'https://esm.sh/date-fns@2';
import { formatInTimeZone, utcToZonedTime, zonedTimeToUtc } from 'https://esm.sh/date-fns-tz@2';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const USER_ID = "66ac5e44-5b18-4883-b323-b13cd0280046";

const TIMEZONE = 'Africa/Nairobi';

function toNairobiTime(date: Date): Date {
  return utcToZonedTime(date, TIMEZONE);
}

function fromNairobiTime(date: Date): Date {
  return zonedTimeToUtc(date, TIMEZONE);
}

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

const bookingSessions = new Map<number, BookingSession>();
const conversationHistory = new Map<number, Message[]>();

const MAX_HISTORY = 30;

function addToHistory(chatId: number, message: Message) {
  const history = conversationHistory.get(chatId) || [];
  history.push(message);
  
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
  
  bookingSessions.delete(chatId);
}

async function handleBookingStep(chatId: number, userMessage: string) {
  let session = bookingSessions.get(chatId) || { step: 'service' };
  let response = '';

  try {
    const context = {
      services: await fetchServices(USER_ID),
      availability: await fetchAvailability(USER_ID),
      serviceRequests: await fetchServiceRequests(USER_ID),
      blockedDates: await fetchBlockedDates(USER_ID)
    };

    switch (session.step) {
      case 'service':
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
          const date = parseISO(userMessage);
          session.scheduledAt = fromNairobiTime(date).toISOString();
          session.step = 'time';
          
          const dayOfWeek = toNairobiTime(date).getDay();
          const daySetting = context.availability.find(s => s.day_of_week === dayOfWeek);
          
          if (!daySetting?.is_available) {
            response = "Sorry, that day is not available. Please choose another date:";
            session.step = 'date';
            break;
          }

          response = `Please choose a time (format: HH:mm) between ${daySetting.start_time.slice(0, 5)} and ${daySetting.end_time.slice(0, 5)}:`;
        } catch {
          response = "Sorry, I didn't understand that date. Please use YYYY-MM-DD format:";
        }
        break;

      case 'time':
        try {
          const [hours, minutes] = userMessage.split(':').map(Number);
          const date = parseISO(session.scheduledAt!);
          const localDate = set(toNairobiTime(date), { hours, minutes, seconds: 0, milliseconds: 0 });
          
          const availability = await isTimeSlotAvailable(date, `${hours}:${minutes}`, context);
          
          if (!availability.available) {
            response = `Sorry, ${availability.reason} Please choose another time:`;
            break;
          }
          
          session.scheduledAt = fromNairobiTime(localDate).toISOString();
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
  } catch (error) {
    console.error('Error in handleBookingStep:', error);
    response = "Sorry, there was an error processing your request. Please try again.";
  }

  bookingSessions.set(chatId, session);
  return response;
}

function formatAvailabilityForDisplay(
  availability: any[],
  serviceRequests: any[],
  blockedDates: any[],
  daysToShow: number = 7
): string {
  const days = Array.from({ length: daysToShow }, (_, i) => {
    const date = toNairobiTime(addDays(new Date(), i));
    const dayOfWeek = date.getDay();
    const daySetting = availability.find(s => s.day_of_week === dayOfWeek);
    
    const isBlocked = blockedDates.some(blocked => 
      isSameDay(toNairobiTime(parseISO(blocked.blocked_date)), date)
    );

    if (isBlocked) {
      return `${formatInTimeZone(date, TIMEZONE, 'EEEE')}: Blocked`;
    }

    if (!daySetting?.is_available) {
      return `${formatInTimeZone(date, TIMEZONE, 'EEEE')}: Closed`;
    }

    const dayBookings = serviceRequests.filter(req => {
      const requestDate = toNairobiTime(parseISO(req.scheduled_at));
      return isSameDay(requestDate, date) && ['pending', 'accepted'].includes(req.status);
    }).map(req => formatInTimeZone(parseISO(req.scheduled_at), TIMEZONE, 'HH:mm'));

    const workingHours = `${daySetting.start_time.slice(0, 5)} - ${daySetting.end_time.slice(0, 5)}`;
    const bookedSlots = dayBookings.length > 0 ? ` (Booked: ${dayBookings.join(', ')})` : '';
    
    return `${formatInTimeZone(date, TIMEZONE, 'EEEE')}: Open ${workingHours}${bookedSlots}`;
  });

  return days.join('\n');
}

async function isTimeSlotAvailable(date: Date, time: string, context: {
  services: any[],
  availability: any[],
  serviceRequests: any[],
  blockedDates: any[]
}) {
  const nairobiDate = toNairobiTime(date);
  
  const isDateBlocked = context.blockedDates.some(blocked => 
    isSameDay(toNairobiTime(parseISO(blocked.blocked_date)), nairobiDate)
  );

  if (isDateBlocked) {
    return {
      available: false,
      reason: 'This date is blocked in the calendar.'
    };
  }

  const dayOfWeek = nairobiDate.getDay();
  const daySetting = context.availability.find(s => s.day_of_week === dayOfWeek);

  if (!daySetting?.is_available) {
    return {
      available: false,
      reason: 'This is not a working day.'
    };
  }

  const [hours, minutes] = time.split(':').map(Number);
  const requestedTime = set(nairobiDate, { hours, minutes });
  
  const startTime = parse(daySetting.start_time, 'HH:mm:ss', nairobiDate);
  const endTime = parse(daySetting.end_time, 'HH:mm:ss', nairobiDate);

  if (requestedTime < startTime || requestedTime >= endTime) {
    return {
      available: false,
      reason: `The requested time is outside working hours (${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}).`
    };
  }

  const isBooked = context.serviceRequests.some(request => {
    const requestDate = toNairobiTime(parseISO(request.scheduled_at));
    return isSameDay(requestDate, nairobiDate) &&
           format(requestDate, 'HH:mm') === time &&
           ['pending', 'accepted'].includes(request.status);
  });

  if (isBooked) {
    return {
      available: false,
      reason: 'This time slot is already booked.'
    };
  }

  return {
    available: true,
    reason: 'Time slot is available.'
  };
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
    addToHistory(chatId, {
      role: 'assistant',
      content: response,
      timestamp: Date.now()
    });
    return response;
  }

  // Format services info
  const servicesInfo = context.services
    .map(service => `${service.name}: KES ${service.price}${service.description ? ` - ${service.description}` : ''}`)
    .join('\n');

  // Get upcoming availability
  const availabilityInfo = formatAvailabilityForDisplay(
    context.availability,
    context.serviceRequests,
    context.blockedDates
  );

  const history = conversationHistory.get(chatId) || [];
  const isFirstMessage = history.length === 1; // Only the current user message

  const systemPrompt = ` 
You are Wairimu, Kevin's AI assistant. Your primary role is to help users schedule appointments based on Kevin's availability while ensuring accuracy and professionalism.

### INTRODUCTION:
${isFirstMessage ? '- Introduce yourself as "Wairimu, Kevin\'s AI assistant"\n' : '- Continue the ongoing conversation naturally without reintroducing yourself\n'}
- Maintain a professional yet friendly tone, adapting to the user's language (English/Swahili/Sheng).

### **AVAILABILITY INFORMATION**:
${availabilityInfo}

### **AVAILABILITY RULES**:
- Kevin's working hours: **Strictly follow** the listed working hours.
- Booked times: **NEVER** suggest times marked as "Booked".
- Open days: **NEVER** say Kevin is unavailable on days marked as "Open".
- Closed days: Clearly state that **no appointments are available**.
- Blocked days: Clearly state that **Kevin is unavailable**.

### **BOOKING RULES**:
1. **Before suggesting a time**, always verify:
   - Is it **within** Kevin's working hours?
   - Is it **not already booked**?
2. If a user requests a **specific time**, check:
   - If it's within working hours → ✅ Proceed to check if it's available.
   - If it's outside working hours → ❌ Politely inform the user and suggest alternative slots.
   - If it's booked → ❌ Inform the user and suggest alternative slots.
3. If **no slots are available**, suggest **alternative open slots** instead of saying "Kevin is unavailable."
4. If a user asks for availability but does not specify a time, suggest the **earliest available** slot.

### **SERVICES OFFERED**:
${servicesInfo}

### **CONVERSATION CONTEXT**:
${history.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}

### **CURRENT USER MESSAGE**:
${userMessage}

Ensure clarity, correctness, and a warm, engaging tone in all responses.
${isFirstMessage ? '' : '\nIMPORTANT: This is an ongoing conversation. Do NOT reintroduce yourself.'}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    addToHistory(chatId, {
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    });

    return aiResponse;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I'm having trouble processing your request right now. Please try again in a moment.";
  }
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
