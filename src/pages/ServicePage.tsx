import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Service, Profile } from '@/types/dashboard';
import { MetaTags } from '@/components/shared/MetaTags';
import { Search, Loader2, Share2 } from 'lucide-react';
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

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.service_categories?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory ? service.category_id === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <MetaTags
        title={`${businessName} - Services`}
        description={`Check out our services at ${businessName}`}
        imageUrl={profileImage}
        url={window.location.href}
      />

      {bannerImage && (
        <div className="w-full flex justify-center bg-gray-900">
          <div className="w-full max-w-screen-lg relative">
            <div className="aspect-video">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${bannerImage})`
                }}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {profileImage && (
            <div className={`relative inline-block ${bannerImage ? '-mt-16' : ''}`}>
              <img
                src={profileImage}
                alt={businessName}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
              />
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{businessName}</h1>
          <p className="text-gray-600 mt-2">Available Services</p>
          
          <Button
            onClick={shareOnWhatsApp}
            className="mt-4 bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </Button>

          <div className="relative max-w-md mx-auto mt-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="mt-4">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-2 p-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
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
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card 
              key={service.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow relative flex flex-col"
            >
              {(service.image_url || (serviceImages[service.id] && serviceImages[service.id].length > 0)) && (
                <div className="relative aspect-video">
                  <img
                    src={serviceImages[service.id]?.[selectedImageIndex[service.id] || 0]?.image_url || service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                    style={{ transition: 'opacity 0.15s ease' }}
                  />
                  {serviceImages[service.id]?.length > 1 && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageNavigation(service.id, 'prev');
                        }}
                        className="bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                      >
                        ←
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageNavigation(service.id, 'next');
                        }}
                        className="bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
              )}
              <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-600 text-sm mb-4 flex-1">{service.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <p className="font-bold text-gebeya-pink">
                    KSh {service.price.toLocaleString()}
                  </p>
                  {service.service_categories && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {service.service_categories.name}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedService(service)}
                  className="mt-4 w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white py-2 rounded-md hover:opacity-90 transition-opacity"
                >
                  Request Service
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            {searchQuery ? "No services found matching your search." : "No services available at the moment."}
          </div>
        )}

        {selectedService && (
          <ServiceCheckoutDialog
            isOpen={true}
            onClose={() => setSelectedService(null)}
            service={selectedService}
          />
        )}
      </div>
    </div>
  );
};

export default ServicePage;
