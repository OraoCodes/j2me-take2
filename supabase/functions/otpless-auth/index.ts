
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';

// Import CORS headers from shared file
import { corsHeaders } from '../_shared/cors.ts';

// Define the request body type
interface RequestBody {
  token: string;
  userData?: {
    waName?: string;
    waNumber?: string;
    waId?: string;
  };
  isSignUp: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get env variables
    const OTPLESS_CLIENT_ID = Deno.env.get('OTPLESS_CLIENT_ID');
    const OTPLESS_CLIENT_SECRET = Deno.env.get('OTPLESS_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Check if required environment variables are set
    if (!OTPLESS_CLIENT_ID || !OTPLESS_CLIENT_SECRET) {
      console.error('Missing OTPless credentials in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error. Missing OTPless credentials.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase credentials in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'Server configuration error. Missing Supabase credentials.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Parse the request body
    const { token, userData, isSignUp } = await req.json() as RequestBody;
    
    if (!token) {
      console.error('Missing token in request body');
      return new Response(
        JSON.stringify({ error: 'Missing token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Received OTPless token:', token.substring(0, 10) + '...');
    console.log('User data:', userData);
    console.log('Is signup flow:', isSignUp);

    // Verify the OTPless token with OTPless API
    const otplessVerifyResponse = await fetch('https://api.otpless.app/api/v1/token/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'client-id': OTPLESS_CLIENT_ID,
        'client-secret': OTPLESS_CLIENT_SECRET,
      },
      body: JSON.stringify({ token }),
    });

    const otplessData = await otplessVerifyResponse.json();
    console.log('OTPless verification response:', otplessData);

    if (!otplessVerifyResponse.ok || !otplessData.success) {
      console.error('OTPless token verification failed:', otplessData);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify WhatsApp authentication' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Extract the user information from the OTPless response
    const userPhone = otplessData.data?.phoneNumber;
    const userName = otplessData.data?.name || userData?.waName || 'WhatsApp User';
    
    if (!userPhone) {
      console.error('No phone number in OTPless response');
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get phone number from WhatsApp authentication' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Create a Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Use phone as email with a special format for WhatsApp OTPless users
    const email = `whatsapp-otpless-${userPhone}@gebeya-jitume.app`;
    
    // Generate a random password
    const password = Math.random().toString(36).slice(-12);

    console.log('Creating/logging in user with email:', email);

    // Check if the user already exists
    const { data: existingUsers, error: getUserError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', userPhone)
      .limit(1);

    const userExists = existingUsers && existingUsers.length > 0;
    console.log('User exists check:', userExists);

    let authResult;

    // If sign up flow or user doesn't exist
    if (isSignUp || !userExists) {
      if (!isSignUp && !userExists) {
        console.log('User does not exist but trying to sign in. Creating account anyway.');
      }
      
      // Create a new user
      authResult = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: userName,
          phone: userPhone,
          auth_provider: 'whatsapp-otpless',
        },
      });
    } else {
      // Sign in existing user
      authResult = await supabase.auth.admin.signInWithEmail({
        email,
      });
    }

    if (authResult.error) {
      console.error('Error with Supabase auth:', authResult.error);
      return new Response(
        JSON.stringify({ 
          error: authResult.error.message || 'Authentication failed' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Supabase auth successful, user ID:', authResult.data.user?.id);

    // If this is a sign up, create/update profile record
    if (isSignUp || !userExists) {
      const userId = authResult.data.user?.id;
      
      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: userName,
            phone: userPhone,
            auth_provider: 'whatsapp-otpless',
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Continue anyway as the user is authenticated
        } else {
          console.log('Profile created/updated successfully');
        }
      }
    }

    // Return the session
    return new Response(
      JSON.stringify({
        success: true,
        session: authResult.data.session,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Unexpected error in OTPless auth function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred during authentication' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
