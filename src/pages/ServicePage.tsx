import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/dashboard';
import { MetaTags } from '@/components/shared/MetaTags';
import { Loader2 } from 'lucide-react';
import { ServiceCheckoutDialog } from '@/components/service-checkout/ServiceCheckoutDialog';
import { ServiceBanner } from '@/components/service-page/ServiceBanner';
import { BusinessProfile } from '@/components/service-page/BusinessProfile';
import { SearchAndCategories } from '@/components/service-page/SearchAndCategories';
import { ServiceCard } from '@/components/service-page/ServiceCard';

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
    const incrementPageViews = async () => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from('page_views')
          .upsert(
            {
              user_id: userId,
              view_count: 1,
              last_viewed_at: new Date().toISOString()
            },
            {
              onConflict: 'user_id',
              update: {
                view_count: supabase.raw('page_views.view_count + 1'),
                last_viewed_at: new Date().toISOString()
              }
            }
          );

        if (error) {
          console.error('Error tracking page view:', error);
        }
      } catch (error) {
        console.error('Error handling page views:', error);
      }
    };

    incrementPageViews();
  }, [userId]);

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

      <ServiceBanner bannerImage={bannerImage} />

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <BusinessProfile
          businessName={businessName}
          profileImage={profileImage}
          onShare={shareOnWhatsApp}
        />

        <SearchAndCategories
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              serviceImages={serviceImages[service.id] || []}
              selectedImageIndex={selectedImageIndex[service.id] || 0}
              onImageNavigation={(direction) => handleImageNavigation(service.id, direction)}
              onServiceSelect={() => setSelectedService(service)}
            />
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
