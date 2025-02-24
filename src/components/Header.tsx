
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { LogOut, UserCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileImage(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileImage(session.user.id);
      } else {
        setProfileImage(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfileImage = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfileImage(data.profile_image_url);
    }
  };

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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" alt="Gebeya" className="h-8" />
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
          <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 border-2 border-gebeya-pink cursor-pointer hover:opacity-90 transition-opacity">
                  <AvatarImage src={profileImage || undefined} alt="Profile" />
                  <AvatarFallback className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span className="truncate">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="outline" className="hidden md:inline-flex">Sign in</Button>
              <Button className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white">
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
