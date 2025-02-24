
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserCircle, Upload } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

export const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const createProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id: userId }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileData) {
        // Profile doesn't exist, create one
        profileData = await createProfile(user.id);
      } else if (error) {
        throw error;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // First, upload the file to storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update the profile with the new image URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });

      await fetchProfile();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload profile picture",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      company_name: formData.get('company_name') as string,
      whatsapp_number: formData.get('whatsapp_number') as string,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gebeya-pink"></div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container max-w-2xl mx-auto px-4 pt-24 pb-12">
        <Card className="border-gebeya-pink/20 shadow-lg">
          <CardHeader className="border-b border-gebeya-pink/10">
            <div className="flex items-center gap-3">
              <UserCircle className="w-8 h-8 text-gebeya-pink" />
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-gebeya-pink/20">
                  <AvatarImage src={profile?.profile_image_url || undefined} alt="Profile" />
                  <AvatarFallback className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white text-2xl">
                    {profile?.company_name?.charAt(0).toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="profilePicture" 
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-gebeya-pink text-white cursor-pointer hover:bg-gebeya-orange transition-colors duration-200 shadow-md"
                >
                  <Upload className="h-5 w-5" />
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && (
                <p className="text-sm text-gebeya-pink mt-3 animate-pulse">Uploading...</p>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-gray-700 font-medium">Business Name</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={profile?.company_name || ''}
                  placeholder="Enter your business name"
                  className="border-gebeya-pink/20 focus-visible:ring-gebeya-pink transition-colors duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_number" className="text-gray-700 font-medium">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  defaultValue={profile?.whatsapp_number || ''}
                  placeholder="Enter your WhatsApp number"
                  className="border-gebeya-pink/20 focus-visible:ring-gebeya-pink transition-colors duration-200"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-all duration-200 shadow-md"
              >
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
