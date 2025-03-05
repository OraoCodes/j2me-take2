import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home, Package, Grid, Users, BadgeDollarSign,
  Calendar, ArrowRight, Wallet, CreditCard, Receipt
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
import ServiceCategories from "./ServiceCategories";
import AvailabilitySettings from "./AvailabilitySettings";

interface DashboardProps {
  initialView?: "service-requests" | "services" | "categories" | "customers" | "marketing" | "availability";
}

const Dashboard = ({ initialView }: DashboardProps = {}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  const [showServiceRequests, setShowServiceRequests] = useState(initialView === "service-requests");
  const [hasRequests, setHasRequests] = useState(false);
  const [showCustomers, setShowCustomers] = useState(initialView === "customers");
  const [showMarketing, setShowMarketing] = useState(initialView === "marketing");
  const [showAvailability, setShowAvailability] = useState(initialView === "availability");
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
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
    
    if (initialView === "services") {
      setShowServices(true);
    } else if (initialView === "categories") {
      setShowCategories(true);
    }
  }, [initialView]);

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
    { label: "All", onClick: () => {
      setShowServices(true);
      setShowCategories(false);
      setShowServiceRequests(false);
      setShowCustomers(false);
      setShowMarketing(false);
      setShowAvailability(false);
      navigate("/dashboard");
    }},
    { label: "Category", onClick: () => {
      setShowCategories(true);
      setShowServices(false);
      setShowServiceRequests(false);
      setShowCustomers(false);
      setShowMarketing(false);
      setShowAvailability(false);
      navigate("/dashboard");
    }},
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
        setShowAvailability(false);
        navigate("/dashboard");
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
        setShowAvailability(false);
        navigate("/dashboard/service-requests");
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
        setShowAvailability(false);
      }
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
        setShowAvailability(false);
      },
      isSelected: showMarketing
    },
    { 
      icon: <Calendar />, 
      label: "Availability",
      onClick: () => {
        setShowCategories(false);
        setShowServices(false);
        setShowServiceRequests(false);
        setShowCustomers(false);
        setShowMarketing(false);
        setShowAvailability(true);
      },
      isSelected: showAvailability
    },
    { 
      icon: <Wallet />, 
      label: "Payments",
      hasSubmenu: true,
      isOpen: isPaymentsOpen,
      submenuItems: [
        { 
          label: "Payment Methods", 
          icon: <CreditCard className="w-4 h-4" />,
          linkTo: "/dashboard/payments/methods"
        },
        { 
          label: "Transactions", 
          icon: <Receipt className="w-4 h-4" />,
          linkTo: "/dashboard/payments/transactions"
        }
      ],
      onClick: () => setIsPaymentsOpen(!isPaymentsOpen)
    }
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
          premiumFeatures={[]}
          businessFeatures={[]}
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
             !showCustomers && !showCreateService && !showMarketing &&
             !showAvailability && (
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

            {showAvailability && <AvailabilitySettings />}

            {showCategories && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <ServiceCategories />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;
