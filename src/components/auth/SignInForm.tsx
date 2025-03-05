import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Key } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GoogleButton } from "./GoogleButton";

interface SignInFormProps {
  setProviderError: (error: string | null) => void;
  onForgotPassword: () => void;
}

export const SignInForm = ({ setProviderError, onForgotPassword }: SignInFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    console.log("Starting sign-in process for:", email);

    try {
      console.log("Attempting Supabase auth signIn...");
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign-in error:", error);
        setFormError(error.message);
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message,
        });
      } else {
        console.log("Sign-in successful:", data);
        // Success will be handled by the auth state change listener
        toast({
          title: "Success",
          description: "You've been signed in successfully!",
        });
      }
    } catch (err) {
      console.error("Unexpected error during sign-in:", err);
      setFormError("An unexpected error occurred. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during sign in.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      {formError && (
        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md">
          {formError}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="signin-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password">Password</Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-gebeya-pink hover:text-gebeya-orange transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="signin-password"
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
        {isLoading ? "Signing in..." : "Sign In"}
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
        text="Sign in with Google"
        setProviderError={setProviderError}
      />
    </form>
  );
};
