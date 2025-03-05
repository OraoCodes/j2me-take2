
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Key } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { sendAuthEmail } from "@/integrations/supabase/client";
import { GoogleButton } from "./GoogleButton";
import { VerificationSent } from "./VerificationSent";

interface SignUpFormProps {
  setProviderError: (error: string | null) => void;
}

export const SignUpForm = ({ setProviderError }: SignUpFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [signupResponse, setSignupResponse] = useState<any>(null);
  const { toast } = useToast();

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSignupResponse(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      console.log("Attempting custom signup for email:", email);
      
      const emailResponse = await sendAuthEmail(
        email, 
        'signup',
        `${window.location.origin}/auth?tab=signin`
      );
      
      console.log("Custom email response:", emailResponse);
      
      if (!emailResponse.success) {
        toast({
          variant: "destructive",
          title: "Email Error",
          description: `Failed to send verification email: ${emailResponse.error}`,
        });
        setSignupResponse({error: emailResponse.error});
      } else {
        setVerificationEmail(email);
        setVerificationSent(true);
        setSignupResponse({
          user: {
            email: email,
            confirmation_sent_at: new Date().toISOString()
          }
        });
        toast({
          title: "Success",
          description: "Verification email sent! Please check your inbox (and spam folder) to complete registration.",
        });
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      setSignupResponse({error: "Unexpected error occurred"});
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <VerificationSent 
        verificationEmail={verificationEmail}
        signupResponse={signupResponse}
        setProviderError={setProviderError}
      />
    );
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            className="pl-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-password"
            name="password"
            type="password"
            required
            className="pl-10"
          />
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90" 
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </Button>
      
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      
      <GoogleButton 
        text="Sign up with Google"
        setProviderError={setProviderError}
      />
    </form>
  );
};
