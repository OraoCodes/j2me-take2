
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Service } from '@/types/dashboard';
import { MetaTags } from '@/components/shared/MetaTags';

const ServicePage = () => {
  const { userId } = useParams();
  const [businessName, setBusinessName] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name, profile_image_url')
          .eq('id', userId)
          .single();

        if (profile) {
          setBusinessName(profile.company_name || "My Business");
          setProfileImage(profile.profile_image_url || "");
        }

        // Fetch services
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
        }

        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
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

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          {profileImage && (
            <img
              src={profileImage}
              alt={businessName}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900">{businessName}</h1>
          <p className="text-gray-600 mt-2">Available Services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {service.image_url && (
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                {service.description && (
                  <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gebeya-pink">
                    KSh {service.price.toLocaleString()}
                  </p>
                  {service.service_categories && (
                    <span className="text-sm text-gray-500">
                      {service.service_categories.name}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No services available at the moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicePage;
