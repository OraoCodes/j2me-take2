
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
      // For signup, we would need to create a token and pass it to the redirect URL
      // This is a simplified version - you might want to create a proper JWT token
      const token = crypto.randomUUID(); // This should actually be a JWT token
      actionUrl = `${redirectUrl}?confirmation_token=${token}`;
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
      const token = crypto.randomUUID(); // This should be a proper token
      actionUrl = `${redirectUrl}?reset_token=${token}`;
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
      const token = crypto.randomUUID(); // This should be a proper token
      actionUrl = `${redirectUrl}?magic_token=${token}`;
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
    const emailResponse = await resend.emails.send({
      from: "Gebeya <noreply@jitume.gebeya.com>",
      to: [email],
      subject: subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in resend-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
