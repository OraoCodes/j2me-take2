
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { corsHeaders } from "../_shared/cors.ts"

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

// Photography specific suggestions to ensure relevant service ideas
const PHOTOGRAPHY_SUGGESTIONS = [
  {
    name: "Portrait Photography Session",
    price: 12000,
    description: "Professional portrait photography session in studio or at location of your choice. Includes digital delivery of 5 edited photos."
  },
  {
    name: "Wedding Photography Package",
    price: 80000,
    description: "Full day wedding photography coverage including ceremony and reception. Includes 200+ edited digital photos."
  },
  {
    name: "Family Photoshoot",
    price: 15000,
    description: "Capture memories with your loved ones. 1-hour session with 10 edited digital photos included."
  },
  {
    name: "Corporate Headshots",
    price: 8000,
    description: "Professional headshots for your business profile, website, or social media. Includes 3 edited photos."
  },
  {
    name: "Product Photography",
    price: 5000,
    description: "High-quality product photography for your business. Price per product with 3 different angles."
  },
  {
    name: "Event Photography",
    price: 25000,
    description: "Professional photography coverage for your special event or celebration. 4 hours of coverage with edited digital photos."
  }
];

// Predefined suggestions for common professions to ensure quality results
const PROFESSION_SUGGESTIONS = {
  "Hairstylist": [
    { name: "Haircut & Styling", price: 2500, description: "Professional haircut and styling tailored to your preferences." },
    { name: "Hair Coloring", price: 4500, description: "Full hair coloring service including consultation and styling." },
    { name: "Bridal Hair Styling", price: 8000, description: "Elegant hairstyling for your special day, includes consultation." }
  ],
  "Barber": [
    { name: "Men's Haircut", price: 800, description: "Classic men's haircut with styling." },
    { name: "Beard Trim & Shaping", price: 500, description: "Professional beard grooming and shaping." },
    { name: "Hot Towel Shave", price: 1200, description: "Traditional hot towel shave with premium products." }
  ],
  "Massage Therapist": [
    { name: "Deep Tissue Massage", price: 4500, description: "60-minute deep tissue massage focusing on problem areas." },
    { name: "Relaxation Massage", price: 3500, description: "60-minute full body relaxation massage." },
    { name: "Sports Massage", price: 5000, description: "Specialized massage for athletes and active individuals." }
  ]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Get the profession from the request
  const { profession } = await req.json()
  console.log(`Received profession: ${profession}`)

  try {
    // Special case for Photographer - return predefined suggestions
    if (profession.toLowerCase().includes('photo') || profession.toLowerCase() === 'photographer') {
      console.log('Using predefined photography suggestions')
      return new Response(
        JSON.stringify({
          services: PHOTOGRAPHY_SUGGESTIONS
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if we have predefined suggestions for this profession
    const professionKey = Object.keys(PROFESSION_SUGGESTIONS).find(
      key => profession.toLowerCase().includes(key.toLowerCase())
    )

    if (professionKey) {
      console.log(`Using predefined suggestions for ${professionKey}`)
      return new Response(
        JSON.stringify({
          services: PROFESSION_SUGGESTIONS[professionKey]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For other professions, use OpenAI to generate suggestions
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a business consultant helping service providers create their service offerings.
            Generate 5 service suggestions for a ${profession}. Each suggestion should include a name, price (in KES), and a brief description.
            The suggestions should be realistic, professionally appealing, and appropriate for the Kenyan market.
            Format your response as a JSON array of objects with the following structure:
            [
              {
                "name": "Service Name",
                "price": 1000,
                "description": "Brief description of the service"
              }
            ]
            Respond with ONLY the JSON array, no other text.`,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API request failed with status ${response.status}`)
    }

    const data = await response.json()
    let services = []

    try {
      const content = data.choices[0].message.content
      // Parse the content, which should be a JSON array
      services = JSON.parse(content.trim())
      console.log(`Generated ${services.length} suggestions`)
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
      // Fallback to generic services
      services = [
        {
          name: `${profession} Consultation`,
          price: 5000,
          description: `Professional consultation with an experienced ${profession}.`,
        },
        {
          name: `Standard ${profession} Service`,
          price: 10000,
          description: `Our most popular service package for ${profession} clients.`,
        },
        {
          name: `Premium ${profession} Package`,
          price: 20000,
          description: `Comprehensive service package for clients needing full ${profession} support.`,
        },
      ]
    }

    return new Response(
      JSON.stringify({ services }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-service-suggestions' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"profession":"photographer"}'
