import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/dashboard';
import { MetaTags } from '@/components/shared/MetaTags';
import { Loader2 } from 'lucide-react';
import { ServiceCheckoutDialog } from '@/components/service-checkout/ServiceCheckoutDialog';
import { BannerCarousel } from '@/components/service-page/BannerCarousel';
import { BusinessProfile } from '@/components/service-page/BusinessProfile';
import { SearchAndFilter } from '@/components/service-page/SearchAndFilter';
import { ServiceGrid } from '@/components/service-page/ServiceGrid';

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

  const filteredServices = services.filter(service => {
    const matchesSearch = 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.service_categories?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory ? service.category_id === selectedCategory : true;
    
    return matchesSearch && matchesCategory;
  });

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

      <BannerCarousel />

      <div className="container mx-auto px-4 py-8">
        <BusinessProfile
          businessName={businessName}
          profileImage={profileImage}
          bannerImage={bannerImage}
        />

        <SearchAndFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />

        <ServiceGrid
          services={filteredServices}
          serviceImages={serviceImages}
          selectedImageIndex={selectedImageIndex}
          handleImageNavigation={handleImageNavigation}
          onServiceSelect={setSelectedService}
        />

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
