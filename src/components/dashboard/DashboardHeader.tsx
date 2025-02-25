
import { Button } from "@/components/ui/button";
import { X, Menu as MenuIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  company_name: string | null;
  profile_image_url: string | null;
  whatsapp_number: string | null;
}

interface DashboardHeaderProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  profile: Profile | null;
}

export const DashboardHeader = ({
  isMobileMenuOpen,
  toggleMobileMenu,
  profile,
}: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    } else {
      navigate("/");
    }
  };

  const navigateToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white z-[100] border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-2">
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
          <span className="text-xl font-semibold text-gebeya-pink">Jitume</span>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 border-2 border-gebeya-pink cursor-pointer hover:opacity-90 transition-opacity">
                <AvatarImage src={profile?.profile_image_url || undefined} alt="Profile" />
                <AvatarFallback className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white">
                  {profile?.company_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="truncate">{profile?.company_name || "My Business"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={navigateToProfile} className="cursor-pointer">
                <UserCircle className="h-4 w-4 mr-2" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
