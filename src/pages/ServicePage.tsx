import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Service, Profile } from '@/types/dashboard';
import { MetaTags } from '@/components/shared/MetaTags';
import { Search, Loader2, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ServiceCheckoutDialog } from '@/components/service-checkout/ServiceCheckoutDialog';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';

interface ServiceImage {
  id: string;
  service_id: string;
  image_url: string;
  sequence: number;
}

const ServicePage = () => {
  const { userId } = useParams();
  const [businessName, setBusinessName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceImages, setServiceImages] = useState<{ [key: string]: ServiceImage[] }>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ [key: string]: number }>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      if (userId) {
        const { data: categoriesData } = await supabase
          .from('service_categories')
          .select('id, name')
          .eq('user_id', userId)
          .eq('is_visible', true)
          .order('sequence', { ascending: true });

        if (categoriesData) {
          setCategories(categoriesData);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name, profile_image_url, banner_image_url')
          .eq('id', userId)
          .single();

        if (profile) {
          setBusinessName(profile.company_name || "My Business");
          setProfileImage(profile.profile_image_url || "");
          setBannerImage(profile.banner_image_url || "");
        }

        const { data: servicesData } = await supabase
          .from('services')
          .select(`
            *,
            service_categories (
              id,
              name
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (servicesData) {
          setServices(servicesData);
          
          const { data: imagesData } = await supabase
            .from('service_images')
            .select('*')
            .in('service_id', servicesData.map(s => s.id))
            .order('sequence', { ascending: true });

          if (imagesData) {
            const imagesByService = imagesData.reduce((acc: { [key: string]: ServiceImage[] }, img) => {
              if (!acc[img.service_id]) {
                acc[img.service_id] = [];
              }
              acc[img.service_id].push(img);
              return acc;
            }, {});
            setServiceImages(imagesByService);
          }
        }

        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [userId]);

  const handleImageNavigation = (serviceId: string, direction: 'prev' | 'next') => {
    const images = serviceImages[serviceId] || [];
    if (images.length <= 1) return;

    const currentIndex = selectedImageIndex[serviceId] || 0;
    let newIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % images.length;
    } else {
      newIndex = (currentIndex - 1 + images.length) % images.length;
    }

    setSelectedImageIndex(prev => ({ ...prev, [serviceId]: newIndex }));
  };

  const shareOnWhatsApp = () => {
    const shareText = `Check out the services at ${businessName}: ${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gebeya-pink" />
      </div>
    );
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.service_categories?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory ? service.category_id === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <MetaTags
        title={`${businessName} - Services`}
        description={`Check out our services at ${businessName}`}
        imageUrl={profileImage}
        url={window.location.href}
      />

      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl relative">
          <div className="aspect-[21/9] sm:aspect-video">
            {bannerImage ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${bannerImage})`
                  }}
                />
                <div className="absolute inset-0 bg-black/20" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-gebeya-pink to-gebeya-orange opacity-10" />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="text-center mb-6">
          <div className="inline-block">
            <img
              src={profileImage || '/placeholder.svg'}
              alt={businessName}
              className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{businessName}</h1>
          <p className="text-gray-600 mt-2">Available Services</p>
          
          <Button
            onClick={shareOnWhatsApp}
            className="mt-4 bg-[#25D366] hover:bg-[#128C7E] text-white w-full sm:w-auto"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <ScrollArea className="w-full">
            <div className="flex space-x-2 p-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-2" />
          </ScrollArea>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredServices.map((service) => (
            <Card 
              key={service.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedService(service)}
            >
              <div className="aspect-[4/3] relative group">
                {(service.image_url || (serviceImages[service.id] && serviceImages[service.id].length > 0)) && (
                  <>
                    <img
                      src={serviceImages[service.id]?.[selectedImageIndex[service.id] || 0]?.image_url || service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                    {serviceImages[service.id]?.length > 1 && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageNavigation(service.id, 'prev');
                          }}
                          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageNavigation(service.id, 'next');
                          }}
                          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    {service.service_categories && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                        {service.service_categories.name}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-gebeya-pink whitespace-nowrap">
                    KSh {service.price.toLocaleString()}
                  </p>
                </div>
                {service.description && (
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{service.description}</p>
                )}
                <Button
                  className="mt-4 w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedService(service);
                  }}
                >
                  Request Service
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center text-gray-500 mt-8 p-8 bg-white rounded-lg shadow-sm">
            {searchQuery ? "No services found matching your search." : "No services available at the moment."}
          </div>
        )}

        {selectedService && (
          <ServiceCheckoutDialog
            isOpen={true}
            onClose={() => setSelectedService(null)}
            service={{
              ...selectedService,
              instant_booking: selectedService.instant_booking || false
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ServicePage;
