
import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <div className={cn("animate-spin rounded-full border-t-2 border-gebeya-pink", className)}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
