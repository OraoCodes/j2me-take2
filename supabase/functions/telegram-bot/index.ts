import { createClient } from '@supabase/supabase-js'
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

async function verifyTelegramWebAppData(telegramData: TelegramUser): Promise<boolean> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
  
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set');
    return false;
  }

  // Create checkString by sorting fields alphabetically
  const checkString = Object.entries(telegramData)
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Create data check hash
  const secretKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const tokenKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(botToken),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const tokenSignature = await crypto.subtle.sign(
    'HMAC',
    tokenKey,
    new TextEncoder().encode(botToken)
  );
  
  const secretKeyBuffer = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    tokenSignature
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    { name: 'HMAC', hash: 'SHA-256' },
    secretKeyBuffer,
    new TextEncoder().encode(checkString)
  );
  
  const hash = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Compare with provided hash
  return hash === telegramData.hash;
}

async function handleTelegramAuth(telegramUser: TelegramUser) {
  try {
    console.log("Handling Telegram auth for user:", telegramUser.id);
    
    // First check if the user already exists by checking user_telegram_connections
    const { data: connectionData, error: connectionError } = await supabase
      .from('user_telegram_connections')
      .select('user_id')
      .eq('telegram_chat_id', telegramUser.id)
      .single();

    if (connectionError && connectionError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing connections:', connectionError);
      throw new Error('Error checking existing user');
    }

    // If we found a connection, sign in as that user
    if (connectionData?.user_id) {
      console.log("Found existing user:", connectionData.user_id);
      
      // Generate a sign-in link for the existing user
      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: `telegram-${telegramUser.id}@gebeya-jitume.app`,
        options: {
          redirectTo: `${supabaseUrl}/auth/v1/callback`
        }
      });

      if (error) {
        console.error('Error generating magic link:', error);
        throw error;
      }

      console.log("Generated authentication link for existing user");
      return { user: connectionData.user_id, action: 'signin', authLink: data.properties.action_link };
    }

    // Otherwise, create a new user
    console.log("Creating new user for Telegram ID:", telegramUser.id);
    const email = `telegram-${telegramUser.id}@gebeya-jitume.app`;
    const password = crypto.randomUUID(); // Generate a random secure password

    // Create user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramUser.id,
        telegram_username: telegramUser.username,
        telegram_first_name: telegramUser.first_name
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log("Created new user:", userData.user.id);

    // Create connection in user_telegram_connections
    const { error: insertError } = await supabase
      .from('user_telegram_connections')
      .insert({
        user_id: userData.user.id,
        telegram_chat_id: telegramUser.id
      });

    if (insertError) {
      console.error('Error creating connection:', insertError);
      throw insertError;
    }

    // Generate a sign-in link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${supabaseUrl}/auth/v1/callback`
      }
    });

    if (error) {
      console.error('Error generating magic link:', error);
      throw error;
    }

    console.log("Generated authentication link for new user");
    return { user: userData.user.id, action: 'signup', authLink: data.properties.action_link };
  } catch (error) {
    console.error('Error in Telegram auth:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Received request:', body);

      // Handle auth flow
      if (body.action === 'auth' && body.telegramUser) {
        const telegramUser = body.telegramUser as TelegramUser;
        
        // For development, we can skip verification
        // In production, uncomment this verification
        /*
        const isValid = await verifyTelegramWebAppData(telegramUser);
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid Telegram data' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        */
        
        const authResult = await handleTelegramAuth(telegramUser);
        
        return new Response(
          JSON.stringify(authResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle verification
      if (body.action === 'verify' && body.userId) {
        const { data, error } = await supabase
          .rpc('check_telegram_connection', { user_id_param: body.userId });
        
        return new Response(
          JSON.stringify({ connected: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
