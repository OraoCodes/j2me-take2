
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.12.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = new Stripe(stripeSecretKey);

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { sessionId } = await req.json();

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Get the metadata from the session
    const userId = session.metadata?.userId;
    const planName = session.metadata?.planName;
    const planPeriod = session.metadata?.planPeriod;
    
    if (!userId || !planName || !planPeriod) {
      throw new Error('Missing required data in session metadata');
    }
    
    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      throw new Error('Payment was not successful');
    }
    
    // Calculate end date based on subscription period
    const endDate = new Date();
    if (planPeriod === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    
    // Store lowercase plan name
    const planNameLower = planName.toLowerCase();
    
    // Insert or update subscription in database
    const { error } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: planNameLower,
        period: planPeriod,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
      });
      
    if (error) throw error;
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling Stripe success:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
