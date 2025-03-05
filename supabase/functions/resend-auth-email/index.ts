
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
    
    const body = await req.text();
    let requestData: EmailRequest;
    
    try {
      requestData = JSON.parse(body);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid request body: ${parseError.message}` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    const { email, type, redirectUrl, meta } = requestData;
    
    if (!email || !type || !redirectUrl) {
      console.error("Missing required fields:", { email, type, redirectUrl });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: email, type or redirectUrl" 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log(`Processing ${type} email for ${email} with redirect to ${redirectUrl}`);
    
    // Generate email content based on type
    let subject = "";
    let content = "";
    let actionUrl = "";
    
    if (type === "signup") {
      // For signup, we need to create the user first if they don't exist
      try {
        console.log("Checking if user exists with email:", email);
        
        // Using listUsers filter instead of getUserByEmail which doesn't exist in this version
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          filter: {
            email: email
          }
        });
        
        if (listError) {
          console.error("Error checking if user exists:", listError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Error checking if user exists: ${listError.message}` 
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        
        const existingUserData = users?.users?.find(user => user.email === email);
        
        if (!existingUserData) {
          console.log("User doesn't exist, creating new user");
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
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Failed to create user: ${createError.message}` 
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              }
            );
          }
          
          console.log("Created new user:", newUser?.user?.id);
        } else {
          console.log("User already exists with email:", email);
        }
      } catch (userError) {
        console.error("Error with user creation:", userError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `User creation error: ${userError.message || JSON.stringify(userError)}` 
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      // Create a sign-in link with a magic link
      try {
        console.log("Generating magic link for signup");
        
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: redirectUrl
          }
        });
        
        if (signInError) {
          console.error("Error generating magic link:", signInError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to generate magic link: ${signInError.message}` 
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        
        if (!signInData || !signInData.properties || !signInData.properties.action_link) {
          console.error("Missing action_link in generated link data");
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Missing action link in generated data" 
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        
        actionUrl = signInData.properties.action_link;
        console.log("Generated magic link for signup:", actionUrl);
        
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
      } catch (linkError) {
        console.error("Error generating link:", linkError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Link generation error: ${linkError.message || JSON.stringify(linkError)}` 
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else if (type === "reset") {
      // Password reset functionality
      try {
        const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: {
            redirectTo: redirectUrl
          }
        });
        
        if (resetError) {
          console.error("Error generating reset link:", resetError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to generate reset link: ${resetError.message}` 
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        
        actionUrl = resetData.properties.action_link;
        console.log("Generated reset link:", actionUrl);
        
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
      } catch (resetLinkError) {
        console.error("Error generating reset link:", resetLinkError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Reset link generation error: ${resetLinkError.message || JSON.stringify(resetLinkError)}` 
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else if (type === "magic_link") {
      // Magic link functionality
      try {
        const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: redirectUrl
          }
        });
        
        if (magicError) {
          console.error("Error generating magic link:", magicError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: `Failed to generate magic link: ${magicError.message}` 
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
        
        actionUrl = magicData.properties.action_link;
        console.log("Generated magic link:", actionUrl);
        
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
      } catch (magicLinkError) {
        console.error("Error generating magic link:", magicLinkError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Magic link generation error: ${magicLinkError.message || JSON.stringify(magicLinkError)}` 
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid email type: ${type}. Must be one of: signup, reset, magic_link` 
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send the email with Resend
    console.log(`Sending email to ${email} with type ${type}`);
    
    try {
      // Using the onboarding@resend.dev which is a verified sender in the free tier
      const emailResponse = await resend.emails.send({
        from: "Gebeya <onboarding@resend.dev>", 
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
