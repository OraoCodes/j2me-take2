
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profession } = await req.json();

    if (!profession) {
      return new Response(
        JSON.stringify({ error: "Profession is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating service suggestions for profession: ${profession}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that generates realistic service suggestions for professionals.'
          },
          { 
            role: 'user', 
            content: `Generate 3-4 service suggestions with reasonable prices in Kenyan Shillings (KES) for a ${profession} in Kenya. Format the response as a JSON array of services, each with "name", "price" (as a number), and "description" fields. Make the suggestions relevant to Kenyan market rates.`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    const suggestionsText = data.choices[0].message.content;
    const suggestions = JSON.parse(suggestionsText);

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating service suggestions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
