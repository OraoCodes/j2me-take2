
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AuthErrorAlertProps {
  error: string;
}

export const AuthErrorAlert = ({ error }: AuthErrorAlertProps) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription>
        {error}
        {error.includes("Extension context invalidated") && (
          <div className="mt-2 text-sm">
            This error may be related to a browser extension. Try disabling extensions or using incognito mode.
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};
