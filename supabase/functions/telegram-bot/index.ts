
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
    const userMessage = message.text?.toLowerCase() || '';

    console.log('Received message:', userMessage); // Debug log

    // Get or initialize conversation context
    let context = conversationContexts.get(chatId) || { step: 'initial' };
    console.log('Current context:', context); // Debug log

    let responseText = '';

    // Reset command
    if (userMessage === '/start' || userMessage === 'start over' || userMessage === 'restart') {
      context = { step: 'initial' };
      responseText = `Hello! I'm Wairimu, your AI assistant. I can help you:\n
1. Book a service
2. Check availability
3. Learn more about our services

How can I assist you today?`;
      conversationContexts.set(chatId, context);
      return new Response(
        JSON.stringify({ text: responseText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        service_categories (
          name
        )
      `)
      .eq('is_active', true);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      throw new Error('Failed to fetch services');
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
        } else if (userMessage.includes('availability')) {
          // Handle availability check
          responseText = "I'll help you check availability. First, which service are you interested in?\n\n";
          services.forEach((service, index) => {
            responseText += `${index + 1}. ${service.name}\n`;
          });
          context.step = 'service_selected';
        } else if (userMessage.includes('services') || userMessage.includes('offer')) {
          responseText = "Here are our services:\n\n";
          services.forEach((service) => {
            responseText += `• ${service.name} - KES ${service.price}\n`;
            if (service.description) {
              responseText += `  ${service.description}\n`;
            }
            responseText += '\n';
          });
          responseText += "Would you like to book any of these services?";
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
            .eq('user_id', context.selectedService.user_id)
            .eq('is_available', true);

          if (!availabilityData || availabilityData.length === 0) {
            responseText = "I apologize, but there are currently no available time slots. Please contact us directly to arrange an appointment.";
            context.step = 'initial';
          } else {
            responseText = `Great! You've selected ${context.selectedService.name}.\n\n`;
            responseText += "Available days:\n";
            availabilityData.forEach(day => {
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              responseText += `${dayNames[day.day_of_week]}: ${day.start_time} - ${day.end_time}\n`;
            });
            responseText += "\nPlease select a day (e.g., 'Monday', 'Tuesday', etc.)";
          }
        } else {
          responseText = "Please select a valid service number from the list above.";
        }
        break;

      case 'date_selected':
        const dayMap: { [key: string]: number } = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        
        const selectedDay = dayMap[userMessage.toLowerCase()];
        if (selectedDay !== undefined) {
          // Check for blocked dates
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          
          const { data: blockedDates } = await supabase
            .from('blocked_dates')
            .select('*')
            .eq('user_id', context.selectedService.user_id)
            .gte('blocked_date', today.toISOString())
            .lte('blocked_date', nextWeek.toISOString());

          if (blockedDates && blockedDates.length > 0) {
            responseText = "The selected day is not available. Please choose another day.";
            break;
          }

          context.selectedDate = userMessage;
          context.step = 'time_selected';
          
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
          responseText = "Please select a valid day of the week (e.g., Monday, Tuesday, etc.).";
        }
        break;

      case 'time_selected':
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (timeRegex.test(userMessage)) {
          context.selectedTime = userMessage;
          context.step = 'collecting_info';
          responseText = "Great! To complete your booking, I need some information:\n\n";
          responseText += "Please provide your:\n1. Full Name\n2. Phone Number\n3. Email (optional)\n\n";
          responseText += "Format: Name, Phone, Email\nExample: John Doe, +254712345678, john@example.com";
        } else {
          responseText = "Please provide a valid time in 24-hour format (e.g., '14:30').";
        }
        break;

      case 'collecting_info':
        const parts = userMessage.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          const [name, phone, email] = parts;
          
          try {
            // Attempt to create the service request
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
              })
              .select()
              .single();

            if (requestError) throw requestError;

            responseText = `Perfect! Your booking for ${context.selectedService.name} has been confirmed for ${context.selectedDate} at ${context.selectedTime}.\n\n`;
            responseText += "You will receive a confirmation shortly. Thank you for booking with us!\n\n";
            responseText += "Need anything else? Just let me know!";
            
            // Reset context
            context = { step: 'initial' };
          } catch (error) {
            console.error('Booking error:', error);
            responseText = "I apologize, but there was an error creating your booking. Please try again or contact us directly.";
            context.step = 'initial';
          }
        } else {
          responseText = "Please provide your information in the format: Name, Phone, Email (optional)\nExample: John Doe, +254712345678, john@example.com";
        }
        break;
    }

    // Update conversation context
    conversationContexts.set(chatId, context);

    console.log('Sending response:', responseText); // Debug log
    
    return new Response(
      JSON.stringify({ text: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in telegram-bot function:', error);
    return new Response(
      JSON.stringify({ 
        text: "I apologize, but I encountered an error. Please type 'start over' to begin again or contact support." 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
