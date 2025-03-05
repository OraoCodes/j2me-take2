
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Key } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { GoogleButton } from "./GoogleButton";
import { supabase } from "@/integrations/supabase/client";

interface SignUpFormProps {
  setProviderError: (error: string | null) => void;
}

export const SignUpForm = ({ setProviderError }: SignUpFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setProviderError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      console.log("Attempting direct signup for email:", email);
      
      // Use Supabase's built-in signup method instead of our custom email verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Set emailRedirectTo to the signin page
          emailRedirectTo: `${window.location.origin}/auth?tab=signin`,
        }
      });
      
      console.log("Signup response:", data, error);
      
      if (error) {
        console.error("Error during signup:", error);
        toast({
          variant: "destructive",
          title: "Sign Up Error",
          description: error.message || "Failed to create account",
        });
        setProviderError(error.message);
      } else {
        // Success case - no need to wait for email verification
        toast({
          title: "Account Created",
          description: "Your account has been created successfully. You can now sign in.",
        });
        
        // Automatically switch to sign in tab after successful signup
        window.location.href = `${window.location.origin}/auth?tab=signin`;
      }
    } catch (err) {
      console.error("Unexpected error during signup:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
      setProviderError("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
