
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  type: "signup" | "reset" | "magic_link";
  redirectUrl: string;
  meta?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Auth email request received");
    const { email, type, redirectUrl, meta }: EmailRequest = await req.json();
    
    // Generate email content based on type
    let subject = "";
    let content = "";
    let actionUrl = "";
    
    if (type === "signup") {
      // For signup, we need to create the user first if they don't exist
      try {
        // Check if user exists first
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
        
        if (!existingUser) {
          // Generate a random password - users will never use this directly
          const tempPassword = Math.random().toString(36).slice(-10);
          
          // Create the user with the admin API
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: false
          });
          
          if (createError) {
            console.error("Error creating user:", createError);
            throw createError;
          }
          
          console.log("Created new user:", newUser?.user?.id);
        } else {
          console.log("User already exists with email:", email);
        }
      } catch (userError) {
        console.error("Error with user creation:", userError);
        // Continue with sending email even if user creation failed
        // This way we don't reveal if an account exists
      }
      
      // Create a sign-in link with a magic link
      const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (signInError) {
        console.error("Error generating magic link:", signInError);
        throw signInError;
      }
      
      actionUrl = signInData.properties.action_link;
      subject = "Confirm your email address";
      content = `
        <h1>Welcome to Gebeya!</h1>
        <p>Thank you for signing up. Please confirm your email address by clicking the button below:</p>
        <a href="${actionUrl}" style="display: inline-block; background-color: #FF385C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Confirm Email</a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${actionUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
      `;
    } else if (type === "reset") {
      // Password reset functionality
      const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (resetError) {
        console.error("Error generating reset link:", resetError);
        throw resetError;
      }
      
      actionUrl = resetData.properties.action_link;
      subject = "Reset your password";
      content = `
        <h1>Reset Your Password</h1>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <a href="${actionUrl}" style="display: inline-block; background-color: #FF385C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${actionUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
      `;
    } else if (type === "magic_link") {
      // Magic link functionality
      const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (magicError) {
        console.error("Error generating magic link:", magicError);
        throw magicError;
      }
      
      actionUrl = magicData.properties.action_link;
      subject = "Your magic link to sign in";
      content = `
        <h1>Sign In to Gebeya</h1>
        <p>Click the button below to sign in to your account:</p>
        <a href="${actionUrl}" style="display: inline-block; background-color: #FF385C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Sign In</a>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${actionUrl}</p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you did not request this email, you can safely ignore it.</p>
      `;
    }

    // Send the email with Resend
    console.log(`Sending email to ${email} with type ${type}`);
    
    try {
      const emailResponse = await resend.emails.send({
        from: "Gebeya <no-reply@gebeya.co>", // Updated from jitume.gebeya.com domain
        to: [email],
        subject: subject,
        html: content,
        text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      });
      
      console.log("Resend API response:", JSON.stringify(emailResponse));
      
      if (emailResponse.error) {
        console.error("Resend API error:", emailResponse.error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: emailResponse.error 
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Email sent successfully to ${email}`, 
          data: emailResponse 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (emailError) {
      console.error("Error sending email with Resend:", emailError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Email sending error: ${emailError.message || JSON.stringify(emailError)}` 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  } catch (error) {
    console.error("Error in resend-auth-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || String(error) 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
