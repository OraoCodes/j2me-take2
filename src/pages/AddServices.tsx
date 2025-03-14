import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Image, Plus, Trash, ChevronUp, ChevronDown, Copy, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  name: string;
  price: number;
  images: Array<{
    file: File;
    preview: string;
  }>;
}

interface ServiceSuggestion {
  name: string;
  price: number;
  description: string;
}

const SERVICE_TYPE_TO_PROFESSION: Record<string, string> = {
  "Beauty & Wellness": "Beauty Professional",
  "Home Services": "Home Service Provider",
  "Professional Services": "Professional Consultant",
  "Health & Fitness": "Fitness Trainer",
  "Education & Tutoring": "Education Specialist",
  "Tech Services": "Technology Expert",
  "Other": "Service Provider"
};

const SPECIFIC_PROFESSION_MAPPING: Record<string, string> = {
  "Photographer": "Photographer",
  "Hairdresser / Hairstylist": "Hairstylist",
  "Nail Technician": "Nail Technician",
  "Makeup Artist": "Makeup Artist", 
  "Personal Trainer": "Personal Trainer",
  "Massage Therapist": "Massage Therapist",
  "Graphic Designer": "Graphic Designer",
  "Social Media Manager": "Social Media Manager",
  "Barber": "Barber",
  "Videographer": "Videographer",
  "Coach": "Life Coach"
};

const AddServices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([{ name: "", price: 0, images: [] }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userProfession, setUserProfession] = useState<string | null>(null);
  const [rawProfession, setRawProfession] = useState<string | null>(null);
  const [displayProfession, setDisplayProfession] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (userProfession) {
      console.log('Preparing to fetch suggestions for:', userProfession);
      fetchServiceSuggestions(userProfession);
    }
  }, [userProfession]);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('service_type, company_name, referral_source')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (profile) {
        setRawProfession(profile.company_name);
        setDisplayProfession(profile.company_name);
        
        let suggestionProfession = SPECIFIC_PROFESSION_MAPPING[profile.company_name || ""] || null;
        
        if (!suggestionProfession && profile.service_type) {
          suggestionProfession = SERVICE_TYPE_TO_PROFESSION[profile.service_type] || null;
        }
        
        if (!suggestionProfession) {
          suggestionProfession = profile.company_name || "Service Provider";
        }
        
        console.log('Setting user profession for suggestions:', suggestionProfession);
        console.log('Raw profession from profile:', profile.company_name);
        console.log('Service type from profile:', profile.service_type);
        
        setUserProfession(suggestionProfession);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchServiceSuggestions = async (profession: string) => {
    setLoadingSuggestions(true);
    try {
      console.log('Fetching suggestions for profession:', profession);
      
      const { data, error } = await supabase.functions.invoke('generate-service-suggestions', {
        body: { profession }
      });

      if (error) {
        console.error('Error fetching service suggestions:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get service suggestions. Please try again.",
        });
        return;
      }

      if (data && data.services) {
        console.log('Received service suggestions:', data.services);
        setSuggestions(data.services);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get service suggestions. Please try again.",
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleImageUpload = (productIndex: number, files: FileList) => {
    const newProducts = [...products];
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    newProducts[productIndex] = {
      ...newProducts[productIndex],
      images: [...newProducts[productIndex].images, ...newImages]
    };
    setProducts(newProducts);
  };

  const removeImage = (productIndex: number, imageIndex: number) => {
    const newProducts = [...products];
    const product = newProducts[productIndex];
    
    URL.revokeObjectURL(product.images[imageIndex].preview);
    
    product.images = product.images.filter((_, index) => index !== imageIndex);
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([...products, { name: "", price: 0, images: [] }]);
  };

  const removeProduct = (index: number) => {
    products[index].images.forEach(image => URL.revokeObjectURL(image.preview));
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const useSuggestion = (suggestion: ServiceSuggestion) => {
    const newProducts = [...products];
    
    let emptyIndex = newProducts.findIndex(p => p.name === "" && p.price === 0 && p.images.length === 0);
    
    if (emptyIndex === -1) {
      newProducts.push({
        name: suggestion.name,
        price: suggestion.price,
        images: []
      });
    } else {
      newProducts[emptyIndex] = {
        ...newProducts[emptyIndex],
        name: suggestion.name,
        price: suggestion.price
      };
    }
    
    setProducts(newProducts);
    
    toast({
      title: "Service Added",
      description: `${suggestion.name} has been added to your services.`
    });
  };

  const saveServices = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to save services",
        });
        return;
      }

      const servicesWithUrls = await Promise.all(
        products.map(async (product) => {
          const imageUrls = await Promise.all(
            product.images.map(async (image) => {
              const fileName = `${crypto.randomUUID()}-${image.file.name}`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('services')
                .upload(fileName, image.file);

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage
                .from('services')
                .getPublicUrl(fileName);

              return publicUrl;
            })
          );

          const { data: service, error: serviceError } = await supabase
            .from('services')
            .insert({
              name: product.name,
              price: product.price,
              user_id: user.id,
              image_url: imageUrls[0],
              is_active: true
            })
            .select()
            .single();

          if (serviceError) throw serviceError;

          if (imageUrls.length > 1) {
            const additionalImages = imageUrls.slice(1).map((url, index) => ({
              service_id: service.id,
              image_url: url,
              sequence: index + 1
            }));

            const { error: imagesError } = await supabase
              .from('service_images')
              .insert(additionalImages);

            if (imagesError) throw imagesError;
          }

          return service;
        })
      );

      toast({
        title: "Success",
        description: "Your services have been saved successfully!",
      });

      navigate('/payment-methods');
    } catch (error) {
      console.error('Error saving services:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save services. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateImage = async (index: number) => {
    const product = products[index];
    if (!product.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a service name first",
      });
      return;
    }

    setIsGeneratingImage(true);
    setSelectedProductIndex(index);

    try {
      const prompt = `Create a professional, high-quality image for a service named "${product.name}". The image should be suitable for a business website and showcase the service in an appealing way.`;

      console.log('Sending request to generate image for:', product.name);

      const { data, error } = await supabase.functions.invoke('generate-service-image', {
        body: { prompt }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.imageData) {
        throw new Error('No image data returned from the API');
      }

      const response = await fetch(data.imageData);
      const blob = await response.blob();
      
      const file = new File([blob], `${product.name}-ai-generated.png`, { type: 'image/png' });

      const newProducts = [...products];
      newProducts[index] = {
        ...newProducts[index],
        images: [...newProducts[index].images, {
          file: file,
          preview: data.imageData
        }]
      };
      setProducts(newProducts);

      toast({
        title: "Success",
        description: "AI image generated successfully!",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate image. Please try again.",
      });
    } finally {
      setIsGeneratingImage(false);
      setSelectedProductIndex(null);
    }
  };

  const navigateBack = () => {
    navigate('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white relative">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-3xl">
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${step === 1 
                    ? "border-gebeya-pink bg-white text-gebeya-pink" 
                    : "border-gray-200 text-gray-400"
                  }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Add Your Services</h1>
          <p className="text-gray-600 text-lg">
            List your services, set pricing, and upload images to showcase your work
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Suggested services for {displayProfession || 'your profession'}</h2>
          <div className="space-y-6">
            {loadingSuggestions ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="p-4 text-left rounded-lg border hover:border-gebeya-pink transition-all cursor-pointer"
                    onClick={() => useSuggestion(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{suggestion.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-gebeya-pink font-medium">KES {suggestion.price.toLocaleString()}</span>
                        <Copy className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{suggestion.description}</p>
                  </div>
                ))}
              </div>
            ) : userProfession ? (
              <div className="text-center py-6">
                <p className="text-gray-500">Loading suggestions for your profession...</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No profession information found. You can still add services manually below.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {products.map((product, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`product-name-${index}`} className="flex items-center gap-2">
                    <span>🔹</span> Service Name
                  </Label>
                  <Input
                    id={`product-name-${index}`}
                    value={product.name}
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index].name = e.target.value;
                      setProducts(newProducts);
                    }}
                    className="mt-1"
                    placeholder="Enter service name"
                  />
                </div>

                <div>
                  <Label htmlFor={`product-price-${index}`} className="flex items-center gap-2">
                    <span>💰</span> Price (KES)
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id={`product-price-${index}`}
                      type="number"
                      value={product.price}
                      onChange={(e) => {
                        const newProducts = [...products];
                        newProducts[index].price = Number(e.target.value);
                        setProducts(newProducts);
                      }}
                      className="pl-12"
                      placeholder="Enter price"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">KES</span>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                      <ChevronUp className="w-4 h-4 text-gray-400 cursor-pointer" />
                      <ChevronDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id={`product-image-${index}`}
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          handleImageUpload(index, e.target.files);
                        }
                      }}
                    />
                    <label
                      htmlFor={`product-image-${index}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      <Image className="w-4 h-4" />
                      Upload images
                    </label>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex items-center gap-2"
                      onClick={() => generateImage(index)}
                      disabled={isGeneratingImage}
                    >
                      <Wand2 className="w-4 h-4" />
                      {isGeneratingImage && selectedProductIndex === index && (
                        <span className="loading loading-spinner loading-sm"></span>
                      )}
                    </Button>
                  </div>
                  <button
                    onClick={() => removeProduct(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>

                {product.images.length > 0 && (
                  <div className="mt-4 flex gap-4 flex-wrap">
                    {product.images.map((image, imageIndex) => (
                      <div key={imageIndex} className="relative">
                        <img
                          src={image.preview}
                          alt={`Service preview ${imageIndex + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index, imageIndex)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addProduct}
          className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gebeya-pink hover:text-gebeya-pink flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Another Service
        </button>

        <div className="mt-12 flex justify-center gap-4">
          <Button
            variant="outline"
            className="w-32"
            onClick={navigateBack}
          >
            Back
          </Button>
          <Button
            variant="outline"
            className="w-32"
            onClick={() => navigate('/payment-methods')}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button 
            className="w-32 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
            onClick={saveServices}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddServices;
