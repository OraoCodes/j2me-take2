
// Import the Deno standard library for HTTP server functionality
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

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
    const { name, profession } = await req.json();
    console.log(`Generating business name for ${name}, profession: ${profession}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.9,
        messages: [
          { 
            role: 'system', 
            content: `You are a creative business name generator specialized in creating unique names that blend English, Swahili, and Sheng (Kenyan street language). 
            Create catchy, memorable business names that could include:
            - Clever wordplay
            - Swahili words or phrases
            - Sheng expressions
            - Modern twists on traditional terms
            Return only the business name, nothing else.`
          },
          { 
            role: 'user', 
            content: `Generate a unique and creative business name for a ${profession}. The owner's name is ${name}. 
            The name should be catchy and could incorporate Swahili, Sheng, or English. Make it stand out and be memorable.
            Each time you're asked, generate a completely different style of name.` 
          }
        ],
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received');
    const businessName = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ businessName }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
