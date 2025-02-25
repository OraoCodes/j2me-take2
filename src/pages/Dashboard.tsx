
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home, Package, Grid, Users, PenTool, Settings, BadgeDollarSign,
  Store, CreditCard, Palette, Menu as MenuIcon, ArrowRight,
  Briefcase, Building2, Settings2, Users2, Mail, MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateService from "@/pages/CreateService";
import ServiceRequestsView from "@/components/service-requests/ServiceRequestsView";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SetupGuideSection } from "@/components/dashboard/SetupGuideSection";
import { BasicPlanSection } from "@/components/dashboard/BasicPlanSection";
import { supabase } from "@/integrations/supabase/client";
import CustomersView from "@/components/customers/CustomersView";
import { Marketing } from "@/components/dashboard/Marketing";
import { ServicesSection } from "@/components/dashboard/ServicesSection";
import { Category, Profile, Service } from "@/types/dashboard";
import { fetchCategories } from "@/utils/categoryUtils";
import { fetchServices, deleteService, updateServiceCategory } from "@/utils/serviceUtils";
import { TooltipProvider } from "@/components/ui/tooltip";

const Dashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesignOpen, setIsDesignOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showServices, setShowServices] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCreateService, setShowCreateService] = useState(false);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showServiceRequests, setShowServiceRequests] = useState(false);
  const [hasRequests, setHasRequests] = useState(false);
  const [showCustomers, setShowCustomers] = useState(false);
  const [showMarketing, setShowMarketing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories().then((fetchedCategories) => {
      setCategories(fetchedCategories);
      setUserCategories(fetchedCategories);
    });
    fetchServices().then(setServices);
    fetchProfile();
    checkServiceRequests();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkServiceRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: requests, error } = await supabase
        .from('service_requests')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      setHasRequests(requests && requests.length > 0);
    } catch (error) {
      console.error('Error checking service requests:', error);
    }
  };

  const handleBusinessNameClick = () => {
    if (profile?.id) {
      navigate(`/services/${profile.id}`);
    }
  };

  const serviceMenuItems = [
    { label: "All", onClick: () => setShowServices(true) },
    { label: "Category", onClick: () => setShowCategories(true) },
  ];

  const designMenuItems = [
    { icon: <Store className="w-4 h-4" />, label: "Service Page", onClick: () => navigate('/service-page') },
    { icon: <CreditCard className="w-4 h-4" />, label: "Checkout" },
    { icon: <Palette className="w-4 h-4" />, label: "Appearance" },
    { icon: <MenuIcon className="w-4 h-4" />, label: "Menu" },
  ];

  const premiumFeatures = [
    { icon: <Briefcase className="h-4 w-4" />, label: "Team", badge: "PREMIUM" },
    { icon: <Building2 className="h-4 w-4" />, label: "Multi-location", badge: "PREMIUM" },
    { icon: <Settings2 className="h-4 w-4" />, label: "Advanced Settings", badge: "PREMIUM" },
  ];

  const businessFeatures = [
    { icon: <Users2 className="h-4 w-4" />, label: "Staff Management", badge: "BUSINESS" },
    { icon: <Mail className="h-4 w-4" />, label: "Email Marketing", badge: "BUSINESS" },
    { icon: <MessageSquare className="h-4 w-4" />, label: "Chat Support", badge: "BUSINESS" },
  ];

  const sidebarItems = [
    { 
      icon: <Home />, 
      label: "Dashboard", 
      onClick: () => {
        setShowCategories(false);
        setShowServices(false);
        setShowServiceRequests(false);
        setShowCustomers(false);
        setShowMarketing(false);
      }
    },
    { 
      icon: <Grid />, 
      label: "Service Requests",
      onClick: () => {
        setShowCategories(false);
        setShowServices(false);
        setShowServiceRequests(true);
        setShowCustomers(false);
        setShowMarketing(false);
      }
    },
    { 
      icon: <Package />, 
      label: "Services",
      hasSubmenu: true,
      isOpen: isServicesOpen,
      submenuItems: serviceMenuItems,
      onClick: () => setIsServicesOpen(!isServicesOpen)
    },
    { 
      icon: <Users />, 
      label: "Customers",
      onClick: () => {
        setShowCategories(false);
        setShowServices(false);
        setShowServiceRequests(false);
        setShowCustomers(true);
        setShowMarketing(false);
      }
    },
    { 
      icon: <PenTool />, 
      label: "Design",
      hasSubmenu: true,
      isOpen: isDesignOpen,
      submenuItems: designMenuItems,
      onClick: () => setIsDesignOpen(!isDesignOpen)
    },
    { 
      icon: <BadgeDollarSign />, 
      label: "Marketing",
      onClick: () => {
        setShowCategories(false);
        setShowServices(false);
        setShowServiceRequests(false);
        setShowCustomers(false);
        setShowMarketing(true);
      },
      isSelected: showMarketing
    },
    { icon: <Settings />, label: "Settings" },
  ];

  const setupSteps = [
    { 
      number: 1, 
      title: "Add your first service", 
      action: "Add service", 
      completed: services.length > 0,
      onClick: () => setShowCreateService(true)
    },
    { 
      number: 2, 
      title: "Create your first service request", 
      action: "Create service request", 
      completed: hasRequests, 
      onClick: () => navigate('/service-page') 
    }
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader 
          isMobileMenuOpen={isMobileMenuOpen}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          profile={profile}
        />

        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-[90] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <DashboardSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          profile={profile}
          sidebarItems={sidebarItems}
          premiumFeatures={premiumFeatures}
          businessFeatures={businessFeatures}
        />

        <div className={cn(
          "transition-all duration-300 ease-in-out pt-16",
          "md:ml-64"
        )}>
          <div className="p-4 md:p-8">
            <div 
              className="flex items-center gap-2 mb-6 cursor-pointer group"
              onClick={handleBusinessNameClick}
            >
              <h1 className="text-2xl font-bold">{profile?.company_name || "My Business"}</h1>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>

            {!showCategories && !showServices && !showServiceRequests && 
             !showCustomers && !showCreateService && !showMarketing && (
              <>
                <SetupGuideSection steps={setupSteps} />
                <BasicPlanSection />
              </>
            )}

            {showCreateService && (
              <CreateService onSuccess={() => setShowCreateService(false)} />
            )}

            {showServices && (
              <ServicesSection
                services={filteredServices}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                userCategories={userCategories}
                onDeleteService={deleteService}
                onUpdateServiceCategory={updateServiceCategory}
                setShowCreateService={setShowCreateService}
              />
            )}

            {showServiceRequests && <ServiceRequestsView />}

            {showCustomers && <CustomersView />}

            {showMarketing && <Marketing />}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;
