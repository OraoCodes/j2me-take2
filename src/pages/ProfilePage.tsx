import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserCircle, Upload, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { Profile } from "@/types/dashboard";
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [tempBannerImage, setTempBannerImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 56.25,
    x: 0,
    y: 0
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const { toast } = useToast();

  const createProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        setTempBannerImage(reader.result as string);
        setShowCropDialog(true);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling banner upload:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process banner image",
      });
    }
  };

  const uploadCroppedImage = async (croppedImageBlob: Blob) => {
    try {
      setUploadingBanner(true);
      
      const fileExt = "png";
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, croppedImageBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Banner image updated successfully",
      });

      await fetchProfile();
      setShowCropDialog(false);
      setTempBannerImage(null);
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload banner image",
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !tempBannerImage) {
      return;
    }

    const image = new Image();
    image.src = tempBannerImage;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x,
      completedCrop.y,
      completedCrop.width,
      completedCrop.height,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          uploadCroppedImage(blob);
        }
      },
      'image/png',
      1
    );
  }, [completedCrop, tempBannerImage]);

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

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

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
              <div className="w-full mb-6 relative">
                <div className="w-full aspect-video rounded-lg bg-gray-100 overflow-hidden">
                  {profile?.banner_image_url ? (
                    <img
                      src={profile.banner_image_url}
                      alt="Profile Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <label 
                  htmlFor="bannerImage" 
                  className="absolute bottom-2 right-2 p-2 rounded-full bg-gebeya-pink text-white cursor-pointer hover:bg-gebeya-orange transition-colors duration-200 shadow-md"
                >
                  <Upload className="h-5 w-5" />
                  <input
                    type="file"
                    id="bannerImage"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                    disabled={uploadingBanner}
                  />
                </label>
                {uploadingBanner && (
                  <p className="text-sm text-gebeya-pink mt-2 text-center animate-pulse">Uploading banner...</p>
                )}
              </div>

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

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-[800px] w-full">
          <DialogHeader>
            <DialogTitle>Crop Banner Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area to fit your banner image. The image will be cropped to a 16:9 aspect ratio.
            </DialogDescription>
          </DialogHeader>
          {tempBannerImage && (
            <div className="mt-4">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={16 / 9}
                className="max-w-full"
              >
                <img
                  src={tempBannerImage}
                  alt="Crop preview"
                  className="max-w-full h-auto"
                />
              </ReactCrop>
            </div>
          )}
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCropDialog(false);
                setTempBannerImage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={!completedCrop || uploadingBanner}
            >
              {uploadingBanner ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
