
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url?: string;
}

const ServicePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndServices = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch profile information
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setProfile(profileData);

          // TODO: Fetch services once we have the services table set up
          // For now using mock data
          setServices([
            {
              id: '1',
              name: 'Nike Zoom',
              price: 1200,
              description: 'High performance running shoes',
              image_url: '/lovable-uploads/7572461e-37bd-498e-ad65-ea5f1d48ae12.png'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndServices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gebeya-pink"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gebeya-pink/10 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {profile?.profile_image_url && (
                <img 
                  src={profile.profile_image_url} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-gebeya-pink"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
                  {profile?.company_name}
                </h1>
                <p className="text-gray-600">{profile?.service_page_link}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-gray-600 hover:text-gebeya-pink hover:bg-pink-50">
                Home
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-gebeya-pink hover:bg-pink-50">
                Search
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card 
              key={service.id} 
              className="overflow-hidden border-gebeya-pink/10 hover:border-gebeya-pink/20 transition-all duration-300 hover:shadow-lg group"
            >
              {service.image_url && (
                <div className="relative overflow-hidden">
                  <img 
                    src={service.image_url} 
                    alt={service.name}
                    className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{service.name}</h3>
                <p className="text-gebeya-pink font-medium mt-1">
                  Ksh {service.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">{service.description}</p>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Order Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ServicePage;
