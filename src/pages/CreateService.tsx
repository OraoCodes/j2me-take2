import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Header } from "@/components/Header";

const CreateService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    whatsappNumber: "",
    pageLink: "",
    profileImage: null as File | null
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, profileImage: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found");
      }

      let profileImageUrl = null;
      if (formData.profileImage) {
        const fileExt = formData.profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, formData.profileImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        profileImageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: formData.businessName,
          whatsapp_number: formData.whatsappNumber,
          service_page_link: formData.pageLink,
          profile_image_url: profileImageUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your service page has been created.",
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="pt-24 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
              Create Your Service Page
            </h1>
            <p className="text-muted-foreground mt-2">
              Enter your essential details to start offering your services online.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Upload */}
            <div className="space-y-2">
              <Label>Upload Your Profile Image</Label>
              <div className="flex items-center justify-center w-full">
                <label className="w-full cursor-pointer">
                  <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-gebeya-pink/20 hover:border-gebeya-pink/40 hover:bg-pink-50/30 transition-colors">
                    <Upload className="w-8 h-8 text-gebeya-pink" />
                    <span className="mt-2 text-sm text-gray-500">Click to upload</span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="businessName">Name *</Label>
              <Input
                id="businessName"
                placeholder="Your Name or Business Name"
                required
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                className="border-gebeya-pink/20 focus-visible:ring-gebeya-pink/30"
              />
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number *</Label>
              <p className="text-sm text-muted-foreground">
                Customers will contact you via WhatsApp for bookings.
              </p>
              <div className="flex gap-2">
                <div className="w-24">
                  <Input 
                    value="+254" 
                    disabled 
                    className="border-gebeya-pink/20 bg-gray-50"
                  />
                </div>
                <Input
                  id="whatsappNumber"
                  placeholder="Phone number"
                  required
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  className="border-gebeya-pink/20 focus-visible:ring-gebeya-pink/30"
                />
              </div>
            </div>

            {/* Service Page Link */}
            <div className="space-y-2">
              <Label htmlFor="pageLink">Service Page Link *</Label>
              <p className="text-sm text-muted-foreground">
                This will be your unique service link. You can upgrade to a custom domain later.
              </p>
              <div className="flex items-center gap-2">
                <div className="shrink-0">
                  <span className="text-muted-foreground">gebeya.com/</span>
                </div>
                <Input
                  id="pageLink"
                  placeholder="nameOfBusiness"
                  required
                  value={formData.pageLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, pageLink: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                  className="border-gebeya-pink/20 focus-visible:ring-gebeya-pink/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Service Page"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateService;
