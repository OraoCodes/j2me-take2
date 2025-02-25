import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
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
  ChevronRight,
  MessagesSquare,
  ScrollText,
  ChevronDown,
  ChevronUp,
  Store,
  CreditCard,
  Palette,
  Menu as MenuIcon,
  Info,
  Import,
  Filter,
  ArrowUpDown,
  FileDown,
  Plus,
  Trash2,
  Edit,
  X,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CategoryItem } from "@/components/categories/CategoryItem";
import { CreateCategoryDialog } from "@/components/categories/CreateCategoryDialog";
import { Input } from "@/components/ui/input";
import { EditCategoryDialog } from "@/components/categories/EditCategoryDialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import CreateService from "@/pages/CreateService";
import { cn } from "@/lib/utils";
import ServiceRequestsView from "@/components/service-requests/ServiceRequestsView";

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
  const navigate = useNavigate();
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
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showServiceRequests, setShowServiceRequests] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    fetchUserCategories();
  }, []);

  useEffect(() => {
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
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch services. Please try again.",
      });
    } else {
      setServices(data || []);
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
      title: "Create your first order", 
      action: "Create order", 
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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

  const handleBusinessNameClick = () => {
    if (profile?.id) {
      navigate(`/services/${profile.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white z-[100] border-b border-gray-200">
        <div className="flex items-center px-4 h-16">
          <Button
            variant="ghost"
            size="icon"
            className="mr-3 md:hidden"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MenuIcon className="h-6 w-6" />
            )}
          </Button>
          <img src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" alt="Logo" className="h-8" />
        </div>
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[90] md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <div className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 py-6 z-[95]",
        "transform transition-transform duration-300 ease-in-out",
        "md:transform-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" alt="Logo" className="h-8 w-8" />
            <div>
              <h2 className="font-semibold">{profile?.company_name || "KicksandSneakers"}</h2>
              <p className="text-sm text-gray-500">take.app/kicksandsneakers</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {sidebarItems.map((item) => (
            <div key={item.label}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (item.onClick) item.onClick();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                  item.hasSubmenu && item.isOpen
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.hasSubmenu && (
                  item.isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </a>
              {item.hasSubmenu && item.isOpen && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.submenuItems?.map((subItem) => (
                    <a
                      key={subItem.label}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (subItem.onClick) subItem.onClick();
                      }}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                      {subItem.icon}
                      {subItem.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-8">
          <p className="px-6 text-xs font-medium text-gray-400 uppercase mb-2">Apps</p>
          <nav className="space-y-1 px-3">
            {[...premiumFeatures, ...businessFeatures].map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.badge === "PREMIUM" 
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>
      </div>

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
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Setup guide</h2>
                    <a href="#" className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                      Tutorials
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="space-y-6">
                    {setupSteps.map((step) => (
                      <div key={step.number} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                            step.completed
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {step.completed ? (
                              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              step.number
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium mb-2">{step.title}</h3>
                            <Button 
                              variant={step.action === "Upgrade" ? "default" : "outline"}
                              className={cn(
                                "w-full justify-center",
                                step.action === "Upgrade" ? "bg-blue-500 hover:bg-blue-600" : ""
                              )}
                              onClick={step.onClick}
                            >
                              {step.action}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange p-6 rounded-xl text-white mb-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Subscribe now at $1</h3>
                    <p className="text-white/90 mb-4">
                      Kickstart a strong 2025 with our Premium Plan - Now just $1 (originally $19)
                    </p>
                    <Button variant="secondary" className="bg-white text-gebeya-pink hover:bg-white/90">
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4">Basic plan</h3>
                <div className="space-y-4">
                  {[
                    { icon: <Settings className="w-5 h-5" />, label: "Setup wizard" },
                    { icon: <FileText className="w-5 h-5" />, label: "Getting started" },
                    { icon: <Users className="w-5 h-5" />, label: "Subscriber guide" },
                    { icon: <MessageCircle className="w-5 h-5" />, label: "Helpdesk" },
                  ].map((item) => (
                    <a
                      key={item.label}
                      href="#"
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            </>
          )}

          {showCreateService ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Create Service</h1>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateService(false)}
                  className="border-gebeya-pink text-gebeya-pink hover:bg-gebeya-pink/10"
                >
                  Back to Dashboard
                </Button>
              </div>
              <CreateService onSuccess={() => setShowCreateService(false)} />
            </>
          ) : showCategories ? (
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
                    className="flex-1 py-3 data-[state=active]:text-gebeya-pink data-[state=active]:border-b-2 data-[state=active]:border-gebeya-pink"
                  >
                    Visible
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hidden"
                    className="flex-1 py-3 data-[state=active]:text-gebeya-pink data-[state=active]:border-b-2 data-[state=active]:border-gebeya-pink"
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
          ) : showServices ? (
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
                            {userCategories.map((
