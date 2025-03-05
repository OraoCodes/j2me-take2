
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Check, Info, RefreshCw } from "lucide-react";
import { GoogleButton } from "./GoogleButton";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { sendAuthEmail } from "@/integrations/supabase/client";

interface VerificationSentProps {
  verificationEmail: string;
  signupResponse: any;
  setProviderError: (error: string | null) => void;
}

export const VerificationSent = ({ 
  verificationEmail, 
  signupResponse,
  setProviderError
}: VerificationSentProps) => {
  const [resendLoading, setResendLoading] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setResendLoading(true);
    try {
      console.log("Attempting to resend verification to:", verificationEmail);
      
      const response = await sendAuthEmail(
        verificationEmail,
        'signup',
        `${window.location.origin}/auth?tab=signin`
      );

      if (!response.success) {
        console.error("Error resending verification:", response.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to resend: ${response.error}`,
        });
      } else {
        console.log("Verification email resent:", response);
        toast({
          title: "Verification email resent",
          description: "Please check your inbox and spam folder.",
        });
      }
    } catch (err) {
      console.error("Unexpected error resending verification:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while resending verification.",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200 mb-4">
        <Check className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Verification email sent!</AlertTitle>
        <AlertDescription className="text-blue-700">
          We've sent a verification email to <strong>{verificationEmail}</strong>. 
          Please check both your inbox and spam folder.
        </AlertDescription>
      </Alert>
      
      {signupResponse && (
        <Alert className="bg-gray-50 border-gray-200 mb-4">
          <Info className="h-4 w-4 text-gray-600" />
          <AlertTitle className="text-gray-800">Technical Details</AlertTitle>
          <AlertDescription className="text-xs text-gray-600">
            <div className="font-mono overflow-auto max-h-24 p-2 bg-gray-100 rounded">
              {JSON.stringify({
                userId: signupResponse?.user?.id,
                email: signupResponse?.user?.email,
                confirmationSent: signupResponse?.user?.confirmation_sent_at,
                emailConfirmed: signupResponse?.user?.email_confirmed_at,
                identities: signupResponse?.user?.identities?.length
              }, null, 2)}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-800">Troubleshooting verification emails:</h3>
        
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
          <li>Check your Spam/Junk folder thoroughly</li>
          <li>Add <strong>noreply@mail.app.supabase.io</strong> to your contacts</li>
          <li>Check any email filters that might be redirecting messages</li>
          <li>Try using a different email provider (Gmail, Outlook, etc.)</li>
          <li>Make sure your Supabase Site URL is set to: <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{window.location.origin}</code></li>
        </ul>
      </div>
      
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600">
          Didn't receive the email? Click below to resend.
        </p>
        
        <Button 
          type="button" 
          variant="outline"
          className="flex items-center gap-2"
          onClick={handleResendVerification}
          disabled={resendLoading}
        >
          {resendLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Resend verification email
            </>
          )}
        </Button>
        
        <div className="mt-6 border-t pt-4">
          <p className="text-sm text-gray-500 mb-3">
            Still having issues? Try signing up with a different method:
          </p>
          <GoogleButton 
            text="Sign up with Google"
            setProviderError={setProviderError}
          />
        </div>
      </div>
    </div>
  );
};
