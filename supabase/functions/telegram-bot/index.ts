
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', await req.clone().text());
    
    const { message } = await req.json();
    
    if (!message || !message.text) {
      console.error('Invalid message format:', message);
      throw new Error('Invalid message format');
    }

    // Always respond with a welcome message for now to test connectivity
    const responseText = `Hello! I'm Wairimu, your AI assistant. I can help you:\n
1. Book a service
2. Check availability
3. Learn more about our services

How can I assist you today?`;

    console.log('Sending response:', responseText);
    
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
