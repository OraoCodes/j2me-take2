
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {profile?.profile_image_url && (
                <img 
                  src={profile.profile_image_url} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{profile?.company_name}</h1>
                <p className="text-gray-500">{profile?.service_page_link}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">Home</button>
              <button className="text-gray-600 hover:text-gray-900">Search</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              {service.image_url && (
                <img 
                  src={service.image_url} 
                  alt={service.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-semibold">{service.name}</h3>
                <p className="text-gray-600 mt-1">Ksh {service.price.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-2">{service.description}</p>
                <button className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                  Order Now
                </button>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ServicePage;
