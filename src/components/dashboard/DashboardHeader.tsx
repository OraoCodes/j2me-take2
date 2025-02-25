
import { Button } from "@/components/ui/button";
import { X, Menu as MenuIcon } from "lucide-react";

interface DashboardHeaderProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export const DashboardHeader = ({
  isMobileMenuOpen,
  toggleMobileMenu,
}: DashboardHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white z-[100] border-b border-gray-200">
      <div className="flex items-center px-4 h-16">
        <Button
          variant="ghost"
          size="icon"
          className="mr-3 md:hidden"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </Button>
        <img src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" alt="Logo" className="h-8" />
      </div>
    </div>
  );
};
