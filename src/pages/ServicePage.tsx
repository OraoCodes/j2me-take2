
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Search, PlusCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Service = Database['public']['Tables']['services']['Row'];
type Category = Database['public']['Tables']['service_categories']['Row'];
type FullProfile = Database['public']['Tables']['profiles']['Row'];
type ProfileDisplay = Pick<FullProfile, 'id' | 'company_name' | 'profile_image_url' | 'service_page_link'>;

interface ServicesByCategory {
  [key: string]: Service[];
}

const ServicePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<ProfileDisplay | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const fetchProfileAndData = async () => {
      try {
        let targetUserId = userId;
        
        if (!targetUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            targetUserId = user.id;
          } else {
            throw new Error("No user ID provided and no user is logged in");
          }
        }

        console.log("Fetching data for user:", targetUserId);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, company_name, profile_image_url, service_page_link')
          .eq('id', targetUserId)
          .maybeSingle();
        
        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw new Error("Failed to fetch profile information");
        }

        console.log("Profile data:", profileData);
        if (profileData) setProfile(profileData);

        // Fetch categories with a simpler query first
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('service_categories')
          .select('*')
          .eq('user_id', targetUserId);

        if (categoriesError) {
          console.error("Categories fetch error:", categoriesError);
          throw new Error("Failed to fetch categories");
        }

        console.log("Categories data:", categoriesData);
        setCategories(categoriesData || []);

        // Fetch all services without filters first
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('user_id', targetUserId);

        if (servicesError) {
          console.error("Services fetch error:", servicesError);
          throw new Error("Failed to fetch services");
        }

        console.log("Services data:", servicesData);
        setServices(servicesData || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndData();
  }, [userId]);

  const getServicesByCategory = () => {
    console.log("Processing services:", services);
    console.log("Available categories:", categories);
    
    const servicesByCategory: ServicesByCategory = {};
    const uncategorizedServices: Service[] = [];

    services.forEach(service => {
      console.log("Processing service:", service);
      if (service.category_id) {
        if (!servicesByCategory[service.category_id]) {
          servicesByCategory[service.category_id] = [];
        }
        servicesByCategory[service.category_id].push(service);
      } else {
        uncategorizedServices.push(service);
      }
    });

    console.log("Services by category:", servicesByCategory);
    console.log("Uncategorized services:", uncategorizedServices);

    return { servicesByCategory, uncategorizedServices };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gebeya-pink"></div>
      </div>
    );
  }

  const { servicesByCategory, uncategorizedServices } = getServicesByCategory();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center mb-8">
          {profile?.profile_image_url ? (
            <img 
              src={profile.profile_image_url} 
              alt={profile?.company_name || "Profile"} 
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
              <span className="text-gray-400 text-2xl">Logo</span>
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2">{profile?.company_name || "Service Provider"}</h1>
        </div>

        <Tabs defaultValue="home" className="w-full mb-8">
          <TabsList className="w-full flex justify-center gap-8">
            <TabsTrigger 
              value="home" 
              onClick={() => setActiveTab("home")}
              className={`flex items-center gap-2 px-4 py-2 ${activeTab === "home" ? "border-b-2 border-black" : ""}`}
            >
              <Home className="w-5 h-5" />
              Home
            </TabsTrigger>
            <TabsTrigger 
              value="search"
              onClick={() => setActiveTab("search")}
              className={`flex items-center gap-2 px-4 py-2 ${activeTab === "search" ? "border-b-2 border-black" : ""}`}
            >
              <Search className="w-5 h-5" />
              Search
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : (
          <>
            {categories.length > 0 ? (
              categories.map(category => {
                const categoryServices = servicesByCategory[category.id] || [];
                return (
                  <div key={category.id} className="mb-8">
                    <h2 className="text-xl font-bold mb-4">{category.name}</h2>
                    {categoryServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {categoryServices.map((service) => (
                          <Card 
                            key={service.id} 
                            className="p-4 flex justify-between items-center border rounded-lg"
                          >
                            <div>
                              <h3 className="font-semibold text-lg">{service.name}</h3>
                              <p className="text-gray-900">Ksh {service.price.toLocaleString()}</p>
                            </div>
                            {service.image_url && (
                              <img 
                                src={service.image_url} 
                                alt={service.name}
                                className="w-24 h-24 object-cover rounded-lg"
                              />
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : null}

            {uncategorizedServices.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Other Services</h2>
                <div className="grid grid-cols-1 gap-4">
                  {uncategorizedServices.map((service) => (
                    <Card 
                      key={service.id} 
                      className="p-4 flex justify-between items-center border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <p className="text-gray-900">Ksh {service.price.toLocaleString()}</p>
                      </div>
                      {service.image_url && (
                        <img 
                          src={service.image_url} 
                          alt={service.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {(!categories.length && !uncategorizedServices.length) && (
              <div className="text-center text-gray-600 py-12">
                No services available at the moment.
              </div>
            )}
          </>
        )}

        <div className="flex flex-col items-center gap-4 mt-8">
          <Button 
            variant="outline"
            className="flex items-center gap-2 px-6 py-3 rounded-full border-2 border-black"
          >
            <PlusCircle className="w-5 h-5" />
            Create your own SoloServe
          </Button>
          <p className="text-gray-600">{profile?.service_page_link}</p>
        </div>
      </div>
    </div>
  );
};

export default ServicePage;
