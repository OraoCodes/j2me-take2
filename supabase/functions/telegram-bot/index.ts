
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationContext {
  step: 'initial' | 'service_selected' | 'date_selected' | 'time_selected' | 'collecting_info';
  selectedService?: any;
  selectedDate?: string;
  selectedTime?: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

const conversationContexts: Map<string, ConversationContext> = new Map();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message } = await req.json();
    const chatId = message.chat.id;
    const userMessage = message.text.toLowerCase();

    // Get or initialize conversation context
    let context = conversationContexts.get(chatId) || { step: 'initial' };
    console.log('Current context:', context);

    let responseText = '';

    // Fetch services if needed
    let services = [];
    if (context.step === 'initial' || userMessage.includes('services')) {
      const { data: servicesData } = await supabase
        .from('services')
        .select(`
          *,
          service_categories (
            name
          )
        `)
        .eq('is_active', true);
      services = servicesData || [];
    }

    // Handle conversation based on current step
    switch (context.step) {
      case 'initial':
        if (userMessage.includes('book') || userMessage.includes('schedule')) {
          responseText = "Here are our available services:\n\n";
          services.forEach((service, index) => {
            responseText += `${index + 1}. ${service.name} - KES ${service.price}\n`;
            if (service.description) {
              responseText += `   ${service.description}\n`;
            }
            responseText += '\n';
          });
          responseText += "\nPlease reply with the number of the service you'd like to book.";
          context.step = 'service_selected';
        } else {
          responseText = `Hello! I'm Wairimu, your AI assistant. I can help you:\n
1. Book a service
2. Check availability
3. Learn more about our services

How can I assist you today?`;
        }
        break;

      case 'service_selected':
        const serviceIndex = parseInt(userMessage) - 1;
        if (!isNaN(serviceIndex) && serviceIndex >= 0 && serviceIndex < services.length) {
          context.selectedService = services[serviceIndex];
          context.step = 'date_selected';
          
          // Fetch available dates
          const { data: availabilityData } = await supabase
            .from('availability_settings')
            .select('*')
            .eq('user_id', context.selectedService.user_id);

          const availableDays = availabilityData?.filter(day => day.is_available) || [];
          
          responseText = `Great! You've selected ${context.selectedService.name}.\n\n`;
          responseText += "Available days:\n";
          availableDays.forEach(day => {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            responseText += `${dayNames[day.day_of_week]}: ${day.start_time} - ${day.end_time}\n`;
          });
          responseText += "\nPlease select a day (e.g., 'Monday', 'Tuesday', etc.)";
        } else {
          responseText = "Please select a valid service number from the list.";
        }
        break;

      case 'date_selected':
        const dayMap: { [key: string]: number } = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        
        const selectedDay = dayMap[userMessage.toLowerCase()];
        if (selectedDay !== undefined) {
          context.selectedDate = userMessage;
          context.step = 'time_selected';
          
          // Fetch available time slots
          const { data: timeSlots } = await supabase
            .from('availability_settings')
            .select('*')
            .eq('user_id', context.selectedService.user_id)
            .eq('day_of_week', selectedDay)
            .eq('is_available', true);

          if (timeSlots && timeSlots.length > 0) {
            const slot = timeSlots[0];
            responseText = `Available times for ${userMessage}:\n`;
            responseText += `Between ${slot.start_time} and ${slot.end_time}\n\n`;
            responseText += "Please specify your preferred time (e.g., '10:00', '14:30')";
          } else {
            responseText = "Sorry, no available times for that day. Please select another day.";
            context.step = 'date_selected';
          }
        } else {
          responseText = "Please select a valid day of the week.";
        }
        break;

      case 'time_selected':
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (timeRegex.test(userMessage)) {
          context.selectedTime = userMessage;
          context.step = 'collecting_info';
          responseText = "Great! To complete your booking, I need some information:\n\n";
          responseText += "Please provide your:\n1. Full Name\n2. Phone Number\n3. Email (optional)\n\n";
          responseText += "Format: Name, Phone, Email";
        } else {
          responseText = "Please provide a valid time in 24-hour format (e.g., '14:30').";
        }
        break;

      case 'collecting_info':
        const parts = userMessage.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          const [name, phone, email] = parts;
          
          // Create the service request
          const { data: requestData, error: requestError } = await supabase
            .from('service_requests')
            .insert({
              service_id: context.selectedService.id,
              user_id: context.selectedService.user_id,
              customer_name: name,
              customer_phone: phone,
              customer_email: email || null,
              scheduled_at: new Date(
                `${context.selectedDate} ${context.selectedTime}`
              ).toISOString(),
              status: 'pending'
            });

          if (requestError) {
            console.error('Booking error:', requestError);
            responseText = "Sorry, there was an error creating your booking. Please try again.";
          } else {
            responseText = `Perfect! Your booking for ${context.selectedService.name} has been confirmed for ${context.selectedDate} at ${context.selectedTime}.\n\n`;
            responseText += "You will receive a confirmation shortly. Thank you for booking with us!";
            // Reset context
            context = { step: 'initial' };
          }
        } else {
          responseText = "Please provide your information in the format: Name, Phone, Email (optional)";
        }
        break;
    }

    // Update conversation context
    conversationContexts.set(chatId, context);

    console.log('Response:', responseText);
    
    return new Response(
      JSON.stringify({ text: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in telegram-bot function:', error);
    return new Response(
      JSON.stringify({ 
        text: "I apologize, but I encountered an error. Please try again or contact support." 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
