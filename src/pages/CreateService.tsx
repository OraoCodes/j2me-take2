import { useState, useEffect } from "react";
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
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Header } from "@/components/Header";
import { FormSection } from "@/components/service-form/FormSection";

interface Category {
  id: string;
  name: string;
}

interface ImagePreview {
  file: File;
  previewUrl: string;
}

interface CreateServiceProps {
  onSuccess?: () => void;
  initialData?: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    is_active: boolean;
    category_id: string | null;
    image_url: string | null;
  };
}

const CreateService = ({ onSuccess, initialData }: CreateServiceProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category_id || "",
    price: initialData?.price?.toString() || "",
    discountedPrice: "",
    duration: "1-hour",
    customDuration: "",
    description: initialData?.description || "",
    instantBooking: true,
    serviceMode: "online",
    travelFee: "",
    serviceArea: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_visible', true)
      .order('sequence', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ImagePreview[] = [];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB.`,
          variant: "destructive",
        });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      newImages.push({ file, previewUrl });
    }

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].previewUrl);
      newImages.splice(index, 1);
      return newImages;
    });
    if (coverImageIndex === index) {
      setCoverImageIndex(0);
    } else if (coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  const setCoverImage = (index: number) => {
    setCoverImageIndex(index);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No user found");
      }

      let coverImageUrl = initialData?.image_url || null;
      if (images.length > 0) {
        const coverImage = images[coverImageIndex];
        const fileExt = coverImage.file.name.split('.').pop();
        const fileName = `${user.id}-cover-${Math.random()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('profile-images')
          .upload(fileName, coverImage.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName);
          coverImageUrl = publicUrl;
        }
      }

      const serviceData = {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        description: formData.description,
        is_active: true,
        category_id: formData.category || null,
        image_url: coverImageUrl,
        instant_booking: formData.instantBooking
      };

      let error;
      let serviceId = initialData?.id;

      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', initialData.id);
        error = updateError;
      } else {
        const { data: newService, error: insertError } = await supabase
          .from('services')
          .insert({
            ...serviceData,
            user_id: user.id,
          })
          .select()
          .single();
        
        error = insertError;
        if (newService) {
          serviceId = newService.id;
        }
      }

      if (error) {
        throw new Error(initialData?.id ? "Failed to update service" : "Failed to create service");
      }

      if (serviceId) {
        for (let i = 0; i < images.length; i++) {
          if (i === coverImageIndex) continue;
        
          const { file } = images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}-${Math.random()}.${fileExt}`;
          
          const { error: uploadError, data } = await supabase.storage
            .from('profile-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('profile-images')
            .getPublicUrl(fileName);

          const { error: imageError } = await supabase
            .from('service_images')
            .insert({
              service_id: serviceId,
              image_url: publicUrl,
              sequence: i
            });

          if (imageError) {
            console.error('Error creating image record:', imageError);
          }
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/service-created");
      }

      toast({
        title: "Success",
        description: initialData?.id ? "Service updated successfully!" : "Service created successfully!",
      });
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
              {initialData ? 'Edit Service' : 'Create New Service'}
            </h1>
            <p className="mt-2 text-gray-600">
              {initialData 
                ? "Update your service details below"
                : "Let's get started with setting up your service details"
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <FormSection number="1" title="Basic Information">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Basic Manicure"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
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

                {formData.duration === 'custom' && (
                  <div>
                    <Label htmlFor="customDuration">Custom Duration (minutes) *</Label>
                    <Input
                      id="customDuration"
                      type="number"
                      min="1"
                      placeholder="e.g., 45"
                      value={formData.customDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, customDuration: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
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
                  <p className="text-sm text-gray-500 mb-2">First image will be used as cover</p>
                  <div className="mt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image.previewUrl}
                            alt={`Preview ${index + 1}`}
                            className={`w-full aspect-square object-cover rounded-lg ${
                              index === coverImageIndex ? 'ring-2 ring-gebeya-pink' : ''
                            }`}
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setCoverImage(index)}
                              className={`p-1.5 rounded-full shadow-md transition-opacity ${
                                index === coverImageIndex
                                  ? 'bg-gebeya-pink text-white opacity-100'
                                  : 'bg-white text-gray-600 opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <label className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg border-gebeya-pink/20 hover:border-gebeya-pink/40 hover:bg-pink-50/30 transition-colors">
                          <Upload className="w-8 h-8 text-gebeya-pink" />
                          <span className="mt-2 text-sm text-gray-500">Upload images</span>
                          <span className="text-xs text-gray-400">Maximum size: 5MB</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
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

                {formData.serviceMode === 'client-location' && (
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
                )}

                {formData.serviceMode === 'my-location' && (
                  <div>
                    <Label htmlFor="serviceArea">My Location Address *</Label>
                    <Input
                      id="serviceArea"
                      placeholder="e.g., 123 Main Street, Building Name, City"
                      value={formData.serviceArea}
                      onChange={(e) => setFormData(prev => ({ ...prev, serviceArea: e.target.value }))}
                      className="mt-1"
                      required
                    />
                  </div>
                )}

                {formData.serviceMode === 'client-location' && (
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
                )}
              </div>
            </FormSection>

            <div className="flex justify-end pt-6 border-t">
              <Button
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading 
                  ? (initialData ? "Saving..." : "Creating...")
                  : (initialData ? "Save Changes" : "Create Service")
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateService;
