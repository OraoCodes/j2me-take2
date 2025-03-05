
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AuthErrorAlertProps {
  error: string | null;
}

export const AuthErrorAlert = ({ error }: AuthErrorAlertProps) => {
  if (!error) return null;
  
  // Check for specific error messages and provide more helpful information
  const isDomainError = error.includes("domain is not verified") || error.includes("validation_error");
  const isExtensionError = error.includes("Extension context invalidated");
  const isRedirectError = error.includes("requested path is invalid") || error.includes("redirect_uri");
  
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription>
        {error}
        
        {isExtensionError && (
          <div className="mt-2 text-sm">
            This error may be related to a browser extension. Try disabling extensions or using incognito mode.
          </div>
        )}
        
        {isDomainError && (
          <div className="mt-2 text-sm">
            There's an issue with our email service. Please try using Google sign-in instead or contact support.
          </div>
        )}

        {isRedirectError && (
          <div className="mt-2 text-sm">
            There's an issue with the authentication configuration. Please make sure the site URL and redirect URL are properly set in Supabase.
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
