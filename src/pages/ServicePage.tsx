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
import ServiceChat from '@/components/service-chat/ServiceChat';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface ServiceImage {
  id: string;
  service_id: string;
  image_url: string;
  sequence: number;
}

const ServicePage = () => {
  const { userId } = useParams();
  const { toast } = useToast();
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
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const incrementPageViews = async () => {
      if (!userId) return;

      try {
        const { data: updateResult, error: updateError } = await supabase
          .rpc('increment_page_views', { user_id_param: userId });

        if (updateError) {
          console.error('Error tracking page view:', updateError);
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

  const handleChatMessage = async (message: string) => {
    console.log('Message received:', message);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
  };

  const handleServiceRequestSubmitted = async (customerData?: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    location?: string;
    scheduledAt: Date;
  }) => {
    toast({
      title: "Service request submitted",
      description: "Your request has been sent to the service provider."
    });
    
    if (selectedService) {
      try {
        console.log('Sending service request notification to n8n webhook');
        
        const message = {
          serviceName: selectedService.name,
          servicePrice: selectedService.price.toLocaleString(),
          serviceProvider: businessName,
          serviceStatus: selectedService.instant_booking === true ? 'accepted' : 'pending',
          
          customerName: customerData?.name || 'Unknown',
          customerPhone: customerData?.phone || 'Unknown',
          customerEmail: customerData?.email || 'Not provided',
          
          appointmentDate: customerData?.scheduledAt ? new Date(customerData.scheduledAt).toISOString() : new Date().toISOString(),
          formattedAppointmentDate: customerData?.scheduledAt ? 
            new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(customerData.scheduledAt)) : 
            'Not specified',
          specialRequests: customerData?.notes || 'None',
          
          location: customerData?.location || 'Not specified',
          
          timestamp: new Date().toISOString(),
          platform: 'Gebeya'
        };

        const response = await fetch('https://martinndlovu.app.n8n.cloud/webhook/16091124-b34e-4c6e-a8f3-7a5856532bac', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          throw new Error(`Error sending webhook notification: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Webhook notification result:', result);
      } catch (notifyError) {
        console.error('Error sending webhook notification:', notifyError);
      }
    }
    
    setSelectedService(null);
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
              onServiceSelect={() => handleServiceSelect(service)}
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
            onSubmitSuccess={handleServiceRequestSubmitted}
          />
        )}

        {showChat && (
          <ServiceChat
            businessName={businessName}
            onSendMessage={handleChatMessage}
          />
        )}
      </div>
      
      <Toaster />
    </div>
  );
};

export default ServicePage;
