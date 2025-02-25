
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
    <div className="fixed top-0 left-0 right-0 bg-white z-[100] border-b border-gebeya-purple/10">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden hover:bg-gebeya-purple/5"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gebeya-purple" />
            ) : (
              <MenuIcon className="h-6 w-6 text-gebeya-purple" />
            )}
          </Button>
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" alt="Logo" className="h-8" />
            <span className="text-xl font-semibold text-gebeya-pink">SoloServe</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-gebeya-pink cursor-pointer hover:opacity-90 transition-all duration-200">
                <AvatarImage src={profile?.profile_image_url || undefined} alt="Profile" />
                <AvatarFallback className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white">
                  {profile?.company_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-gebeya-purple/10" align="end">
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-gebeya-pink" />
                <span className="truncate text-gebeya-purple">{profile?.company_name || "My Business"}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gebeya-purple/10" />
              <DropdownMenuItem onClick={navigateToProfile} className="cursor-pointer hover:bg-gebeya-purple/5">
                <UserCircle className="h-4 w-4 mr-2 text-gebeya-pink" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700">
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
