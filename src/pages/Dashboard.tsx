import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Package,
  Grid,
  Users,
  PenTool,
  Settings,
  Tag,
  BarChart,
  FileText,
  CalendarClock,
  MessageCircle,
  Inbox,
  BadgeDollarSign,
  MessagesSquare,
  ScrollText,
  Store,
  CreditCard,
  Palette,
  Menu as MenuIcon,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Import,
  Filter,
  ArrowUpDown,
  FileDown,
  Plus,
  Trash2,
  Edit,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryItem } from "@/components/categories/CategoryItem";
import { CreateCategoryDialog } from "@/components/categories/CreateCategoryDialog";
import { EditCategoryDialog } from "@/components/categories/EditCategoryDialog";
import CreateService from "@/pages/CreateService";
import ServiceRequestsView from "@/components/service-requests/ServiceRequestsView";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SetupGuideSection } from "@/components/dashboard/SetupGuideSection";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { BasicPlanSection } from "@/components/dashboard/BasicPlanSection";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  is_visible: boolean;
  sequence: number;
  user_id: string;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
}

interface Profile {
  id: string;
  company_name: string | null;
  profile_image_url: string | null;
  whatsapp_number: string | null;
}

const Dashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesignOpen, setIsDesignOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visible");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showServices, setShowServices] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>("");
  const [showCreateService, setShowCreateService] = useState(false);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showServiceRequests, setShowServiceRequests] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchServices();
    fetchUserCategories();
    fetchProfile();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('sequence', { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
      });
    } else {
      setCategories(data as Category[]);
    }
  };

  const fetchServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          service_categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (servicesError) {
        console.error("Services fetch error:", servicesError);
        throw new Error("Failed to fetch services");
      }

      console.log("Services data:", servicesData);
      setServices(servicesData || []);

    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch services. Please try again.",
      });
    }
  };

  const fetchUserCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sequence', { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
      });
    } else {
      setUserCategories(data || []);
    }
  };

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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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

  const sidebarItems = [
    { 
      icon: <Home />, 
      label: "Dashboard", 
      onClick: () => {
        setShowCategories(false);
        setShowServices(false);
        setShowServiceRequests(false);
      }
    },
    { 
      icon: <Grid />, 
      label: "Service Requests",
      onClick: () => {
        setShowCategories(false);
        setShowServices(false);
        setShowServiceRequests(true);
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
    { icon: <Users />, label: "Customers" },
    { 
      icon: <PenTool />, 
      label: "Design",
      hasSubmenu: true,
      isOpen: isDesignOpen,
      submenuItems: designMenuItems,
      onClick: () => setIsDesignOpen(!isDesignOpen)
    },
    { icon: <Settings />, label: "Settings" },
  ];

  const premiumFeatures = [
    { icon: <Tag />, label: "Discounts", badge: "PREMIUM" },
    { icon: <MessagesSquare />, label: "Reviews", badge: "PREMIUM" },
    { icon: <BarChart />, label: "Analytics", badge: "PREMIUM" },
    { icon: <ScrollText />, label: "Pages", badge: "PREMIUM" },
    { icon: <CalendarClock />, label: "Booking", badge: "PREMIUM" },
  ];

  const businessFeatures = [
    { icon: <MessageCircle />, label: "WhatsApp Business", badge: "BUSINESS" },
    { icon: <Inbox />, label: "Inbox", badge: "BUSINESS" },
    { icon: <BadgeDollarSign />, label: "Marketing" },
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
      action: "Create request", 
      completed: false, 
      onClick: () => navigate('/service-page') 
    },
    { 
      number: 3, 
      title: "Add delivery options", 
      action: "Add delivery", 
      completed: true 
    },
    { 
      number: 4, 
      title: "Set up payment methods", 
      action: "Add payment", 
      completed: false 
    },
    { 
      number: 5, 
      title: "Set up custom domain", 
      action: "Upgrade", 
      completed: false 
    },
    { 
      number: 6, 
      title: "Invite staff", 
      action: "Upgrade", 
      completed: false 
    },
  ];

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCategories = categories.filter(category => 
    activeTab === "visible" ? category.is_visible : !category.is_visible
  );

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Category name cannot be empty.",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('service_categories')
      .insert([
        {
          name: newCategoryName.trim(),
          sequence: categories.length,
          user_id: user.id
        }
      ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create category. Please try again.",
      });
    } else {
      toast({
        title: "Success",
        description: "Category created successfully.",
      });
      setNewCategoryName("");
      setIsDialogOpen(false);
      fetchCategories();
    }
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEditing = async () => {
    if (!editingId || !editingName.trim()) return;

    const { error } = await supabase
      .from('service_categories')
      .update({ name: editingName.trim() })
      .eq('id', editingId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category name. Please try again.",
      });
    } else {
      toast({
        title: "Success",
        description: "Category updated successfully.",
      });
      setEditingId(null);
      setEditingName("");
      fetchCategories();
    }
  };

  const toggleVisibility = async (category: Category) => {
    const { error } = await supabase
      .from('service_categories')
      .update({ is_visible: !category.is_visible })
      .eq('id', category.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category visibility. Please try again.",
      });
    } else {
      fetchCategories();
    }
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete service. Please try again.",
      });
    } else {
      toast({
        title: "Success",
        description: "Service deleted successfully.",
      });
      fetchServices();
    }
  };

  const handleEditService = (serviceId: string) => {
    navigate(`/edit-service/${serviceId}`);
  };

  const handleEditCategory = async (categoryData: {
    name: string;
    is_visible: boolean;
    description?: string;
  }) => {
    if (!selectedCategory) return;

    const { error } = await supabase
      .from('service_categories')
      .update({
        name: categoryData.name,
        is_visible: categoryData.is_visible,
      })
      .eq('id', selectedCategory.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category. Please try again.",
      });
    } else {
      toast({
        title: "Success",
        description: "Category updated successfully.",
      });
      fetchCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category. Please try again.",
      });
    } else {
      toast({
        title: "Success",
        description: "Category deleted successfully.",
      });
      fetchCategories();
    }
  };

  const handleUpdateServiceCategory = async (serviceId: string, categoryId: string) => {
    const { error } = await supabase
      .from('services')
      .update({ category_id: categoryId })
      .eq('id', serviceId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update service category. Please try again.",
      });
    } else {
      toast({
        title: "Success",
        description: "Service category updated successfully.",
      });
      fetchServices();
      setSelectedServiceId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        isMobileMenuOpen={isMobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        profile={profile}
      />

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[90] md:hidden"
          onClick={toggleMobileMenu}
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

          {!showCategories && !showServices && !showServiceRequests && !showCreateService && (
            <>
              <SetupGuideSection steps={setupSteps} />
              <SubscriptionCard />
              <BasicPlanSection />
            </>
          )}

          {showCreateService && (
            <CreateService onSuccess={() => setShowCreateService(false)} />
          )}

          {showCategories && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-gebeya-pink">Category</h1>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gebeya-pink" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Organize your services into categories</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10">
                    Change sequence
                  </Button>
                  <CreateCategoryDialog
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    categoryName={newCategoryName}
                    onCategoryNameChange={setNewCategoryName}
                    onCreateCategory={createCategory}
                  />
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-white border-b border-gray-200 p-0 h-auto">
                  <TabsTrigger 
                    value="visible" 
                    className="flex-1 py-3"
                  >
                    Visible
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hidden"
                    className="flex-1 py-3"
                  >
                    Hidden
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="visible" className="mt-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                    {filteredCategories.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        editingId={editingId}
                        editingName={editingName}
                        onStartEditing={startEditing}
                        onSaveEditing={saveEditing}
                        onCancelEditing={cancelEditing}
                        onEditingNameChange={setEditingName}
                        onToggleVisibility={toggleVisibility}
                        onEditCategory={setSelectedCategory}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="hidden" className="mt-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                    {filteredCategories.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        editingId={editingId}
                        editingName={editingName}
                        onStartEditing={startEditing}
                        onSaveEditing={saveEditing}
                        onCancelEditing={cancelEditing}
                        onEditingNameChange={setEditingName}
                        onToggleVisibility={toggleVisibility}
                        onEditCategory={setSelectedCategory}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <EditCategoryDialog
                isOpen={!!selectedCategory}
                onClose={() => setSelectedCategory(null)}
                category={selectedCategory}
                onSave={handleEditCategory}
                onDelete={handleDeleteCategory}
              />
            </>
          )}

          {showServices && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-gebeya-pink">Services</h1>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gebeya-pink" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Manage your services</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10">
                    <Import className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10">
                    Bulk edit
                  </Button>
                  <Button 
                    onClick={() => setShowCreateService(true)}
                    className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add service
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Search by service name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md focus:ring-gebeya-pink focus:border-gebeya-pink"
                      />
                    </div>
                    <Button variant="outline" size="icon" className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10">
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10">
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 flex items-center hover:bg-gray-50/80"
                    >
                      <input 
                        type="checkbox" 
                        className="mr-4 rounded border-gebeya-pink text-gebeya-pink focus:ring-gebeya-pink" 
                      />
                      <div className="w-16 h-16 rounded bg-gray-100 mr-4">
                        {service.image_url && (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className="text-gebeya-pink font-medium">KSh {service.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Select
                          value={service.category_id || ""}
                          onValueChange={(value) => handleUpdateServiceCategory(service.id, value)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {userCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditService(service.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {showServiceRequests && <ServiceRequestsView />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
