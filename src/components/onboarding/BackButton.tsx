
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  previousRoute?: string;
  className?: string;
  onClick?: () => void;
}

export const BackButton = ({ previousRoute, className = "", onClick }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else if (previousRoute) {
      navigate(previousRoute);
    } else {
      navigate(-1); // Go back to the previous page in history
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`absolute top-6 left-6 z-20 ${className}`}
      onClick={handleBack}
      aria-label="Go back"
    >
      <ChevronLeft className="h-6 w-6" />
    </Button>
  );
};
