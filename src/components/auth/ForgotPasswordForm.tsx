import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { sendAuthEmail } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { success, error } = await sendAuthEmail(email, 'reset', `${window.location.origin}/auth?tab=reset-password`);
      
      if (success) {
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link. Please check your email.",
        });
        setEmail("");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: error || "Failed to send reset email. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Sending Reset Link...</span>
            </div>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Remember your password?{" "}
          <button
            type="button"
            onClick={() => window.location.href = "/auth?tab=signin"}
            className="text-gebeya-pink hover:text-gebeya-orange font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
}; 