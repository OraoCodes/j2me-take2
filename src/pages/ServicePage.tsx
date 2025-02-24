
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, Search, PlusCircle, Send } from "lucide-react";
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

  const handleRequestService = (serviceId: string, serviceName: string) => {
    console.log(`Requesting service: ${serviceName} (ID: ${serviceId})`);
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
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          {profile?.profile_image_url ? (
            <img 
              src={profile.profile_image_url} 
              alt={profile?.company_name || "Profile"} 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mb-3 sm:mb-4 ring-2 ring-gebeya-pink ring-offset-2"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-100 mb-3 sm:mb-4 flex items-center justify-center ring-2 ring-gebeya-pink ring-offset-2">
              <span className="text-gebeya-orange text-xl sm:text-2xl">Logo</span>
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-bold mb-2 text-[#181326] text-center">{profile?.company_name || "Service Provider"}</h1>
        </div>

        <Tabs defaultValue="home" className="w-full mb-6 sm:mb-8">
          <TabsList className="w-full flex justify-center gap-2 bg-white p-1 shadow-sm rounded-xl border border-pink-100">
            <TabsTrigger 
              value="home" 
              onClick={() => setActiveTab("home")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "home" 
                ? "bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white [&>svg]:text-white shadow-md" 
                : "text-[#181326] hover:bg-pink-50"
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </TabsTrigger>
            <TabsTrigger 
              value="search"
              onClick={() => setActiveTab("search")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "search" 
                ? "bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white [&>svg]:text-white shadow-md" 
                : "text-[#181326] hover:bg-pink-50"
              }`}
            >
              <Search className="w-4 h-4" />
              Search
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {error ? (
          <div className="text-center text-red-500 py-8 sm:py-12">{error}</div>
        ) : (
          <>
            {categories.length > 0 ? (
              categories.map(category => {
                const categoryServices = servicesByCategory[category.id] || [];
                return (
                  <div key={category.id} className="mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-[#181326]">{category.name}</h2>
                    {categoryServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {categoryServices.map((service) => (
                          <Card 
                            key={service.id} 
                            className="p-3 sm:p-4 border-pink-200 hover:shadow-lg transition-shadow duration-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-base sm:text-lg mb-1 text-[#181326]">{service.name}</h3>
                                <p className="text-gebeya-pink mb-2">Ksh {service.price.toLocaleString()}</p>
                                <Button
                                  onClick={() => handleRequestService(service.id, service.name)}
                                  className="w-full sm:w-auto bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white transition-colors duration-200"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Request Service
                                </Button>
                              </div>
                              {service.image_url && (
                                <img 
                                  src={service.image_url} 
                                  alt={service.name}
                                  className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg ring-1 ring-pink-200"
                                />
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : null}

            {uncategorizedServices.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-[#181326]">Other Services</h2>
                <div className="grid grid-cols-1 gap-4">
                  {uncategorizedServices.map((service) => (
                    <Card 
                      key={service.id} 
                      className="p-3 sm:p-4 border-pink-200 hover:shadow-lg transition-shadow duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg mb-1 text-[#181326]">{service.name}</h3>
                          <p className="text-gebeya-pink mb-2">Ksh {service.price.toLocaleString()}</p>
                          <Button
                            onClick={() => handleRequestService(service.id, service.name)}
                            className="w-full sm:w-auto bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white transition-colors duration-200"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Request Service
                          </Button>
                        </div>
                        {service.image_url && (
                          <img 
                            src={service.image_url} 
                            alt={service.name}
                            className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg ring-1 ring-pink-200"
                          />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {(!categories.length && !uncategorizedServices.length) && (
              <div className="text-center text-gebeya-pink py-8 sm:py-12">
                No services available at the moment.
              </div>
            )}
          </>
        )}

        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          <Button 
            variant="outline"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full border-2 border-gebeya-pink text-[#181326] hover:bg-pink-50 transition-colors duration-200"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            Create your own SoloServe
          </Button>
          <p className="text-sm sm:text-base text-gebeya-pink text-center">{profile?.service_page_link}</p>
        </div>
      </div>
    </div>
  );
};

export default ServicePage;
