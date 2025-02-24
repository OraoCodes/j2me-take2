
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Clock, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Header } from "@/components/Header";
import { FormSection } from "@/components/service-form/FormSection";

const CreateService = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    visibility: "public",
    category: "",
    serviceType: "one-time",
    price: "",
    discountedPrice: "",
    duration: "1-hour",
    customQuote: false,
    description: "",
    profileImage: null as File | null,
    instantBooking: true,
    whatsappEnabled: true,
    serviceMode: "online",
    travelFee: "",
    serviceArea: "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image size should be less than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
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
        
        const { error: uploadError, data } = await supabase.storage
          .from('profile-images')
          .upload(fileName, formData.profileImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error("Failed to upload image");
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        profileImageUrl = publicUrl;
      }

      const { error: createError } = await supabase
        .from('services')
        .insert({
          name: formData.name,
          price: parseFloat(formData.price) || 0,
          description: formData.description,
          image_url: profileImageUrl,
          is_active: formData.visibility === 'public',
          user_id: user.id
        });

      if (createError) {
        throw new Error("Failed to create service");
      }

      navigate('/service-created');
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Create New Service
            </h1>
            <p className="mt-2 text-gray-600">
              Let's get started with setting up your service details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection number="1" title="Basic Information">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Logo Design, Home Cleaning, Photography Session"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={formData.visibility}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="home">Home Services</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="serviceType">Service Type</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-Time</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            <FormSection number="2" title="Pricing & Duration">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Price (KES) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="discountedPrice">Discounted Price (Optional)</Label>
                  <Input
                    id="discountedPrice"
                    type="number"
                    placeholder="e.g., 4500"
                    value={formData.discountedPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountedPrice: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Service Duration</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30-min">30 minutes</SelectItem>
                      <SelectItem value="1-hour">1 hour</SelectItem>
                      <SelectItem value="2-hours">2 hours</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Custom Quote Option</Label>
                    <p className="text-sm text-gray-500">Enable flexible pricing inquiry</p>
                  </div>
                  <Switch
                    checked={formData.customQuote}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, customQuote: checked }))}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection number="3" title="Service Description & Media">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Explain what the service includes, requirements, and benefits..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 h-32"
                    required
                  />
                </div>

                <div>
                  <Label>Images / Portfolio</Label>
                  <div className="mt-1">
                    <div className="flex items-center justify-center w-full">
                      <label className="w-full cursor-pointer">
                        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-gebeya-pink/20 hover:border-gebeya-pink/40 hover:bg-pink-50/30 transition-colors relative">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-contain rounded-lg"
                            />
                          ) : (
                            <>
                              <Upload className="w-8 h-8 text-gebeya-pink" />
                              <span className="mt-2 text-sm text-gray-500">Upload images</span>
                              <span className="text-xs text-gray-400">Maximum size: 5MB</span>
                            </>
                          )}
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
                </div>
              </div>
            </FormSection>

            <FormSection number="4" title="Booking & Availability">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Instant Booking</Label>
                    <p className="text-sm text-gray-500">Auto-approve bookings</p>
                  </div>
                  <Switch
                    checked={formData.instantBooking}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instantBooking: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>WhatsApp Inquiry</Label>
                    <p className="text-sm text-gray-500">Enable direct messaging</p>
                  </div>
                  <Switch
                    checked={formData.whatsappEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, whatsappEnabled: checked }))}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection number="5" title="Delivery & Location">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="serviceMode">Service Mode</Label>
                  <Select
                    value={formData.serviceMode}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceMode: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select service mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="client-location">At Client's Location</SelectItem>
                      <SelectItem value="my-location">At My Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="travelFee">Travel Fee (Optional)</Label>
                  <Input
                    id="travelFee"
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.travelFee}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelFee: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceArea">Service Area / Regions Covered</Label>
                  <Input
                    id="serviceArea"
                    placeholder="e.g., Nairobi, Mombasa"
                    value={formData.serviceArea}
                    onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection number="6" title="Advanced Settings">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-3 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Available on Business & Premium plans</span>
                </div>
              </div>
            </FormSection>

            <div className="flex justify-end pt-6 border-t">
              <Button
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Service"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateService;
