import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Home, Package, Grid, Users, PenTool, Settings, Tag, BarChart, FileText, CalendarClock, MessageCircle, Inbox, BadgeDollarSign, ChevronRight, MessagesSquare, ScrollText, ChevronDown, ChevronUp, Store, CreditCard, Palette, Menu as MenuIcon, Info, Import, Filter, ArrowUpDown, FileDown, Plus, Trash2 } from "lucide-react";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [isDesignOpen, setIsDesignOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(true);
  const [showServices, setShowServices] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visible");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  const fetchCategories = async () => {
    console.log("Fetching categories...");
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('sequence', { ascending: true });

    if (error) {
      console.error("Error fetching categories:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories. Please try again."
      });
    } else {
      console.log("Categories fetched:", data);
      setCategories(data || []);
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
        description: "Failed to fetch services. Please try again."
      });
    } else {
      setServices(data || []);
    }
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Category name cannot be empty."
      });
      return;
    }
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      error
    } = await supabase.from('service_categories').insert([{
      name: newCategoryName.trim(),
      sequence: categories.length,
      user_id: user.id
    }]);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create category. Please try again."
      });
    } else {
      toast({
        title: "Success",
        description: "Category created successfully."
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
    const {
      error
    } = await supabase.from('service_categories').update({
      name: editingName.trim()
    }).eq('id', editingId);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category name. Please try again."
      });
    } else {
      toast({
        title: "Success",
        description: "Category updated successfully."
      });
      setEditingId(null);
      setEditingName("");
      fetchCategories();
    }
  };

  const toggleVisibility = async (category: Category) => {
    const {
      error
    } = await supabase.from('service_categories').update({
      is_visible: !category.is_visible
    }).eq('id', category.id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category visibility. Please try again."
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
        description: "Failed to delete service. Please try again."
      });
    } else {
      toast({
        title: "Success",
        description: "Service deleted successfully."
      });
      fetchServices();
    }
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
        is_visible: categoryData.is_visible
      })
      .eq('id', selectedCategory.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category. Please try again."
      });
    } else {
      toast({
        title: "Success",
        description: "Category updated successfully."
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
        description: "Failed to delete category. Please try again."
      });
    } else {
      toast({
        title: "Success",
        description: "Category deleted successfully."
      });
      fetchCategories();
    }
  };

  const handleUpdateServiceCategory = async (serviceId: string, categoryId: string) => {
    const { error } = await supabase
      .from('services')
      .update({
        category_id: categoryId
      })
      .eq('id', serviceId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update service category. Please try again."
      });
    } else {
      toast({
        title: "Success",
        description: "Service category updated successfully."
      });
      fetchServices();
      setSelectedServiceId(null);
    }
  };

  const handleMenuClick = (menuName: string) => {
    setShowCategories(false);
    setShowServices(false);
    
    switch (menuName) {
      case 'dashboard':
        break;
      case 'categories':
        setShowCategories(true);
        break;
      case 'services':
        setShowServices(true);
        break;
      default:
        break;
    }
  };

  const serviceMenuItems = [{
    label: "All",
    onClick: () => setShowServices(true)
  }, {
    label: "Category",
    onClick: () => setShowCategories(true)
  }];

  const designMenuItems = [{
    icon: <Store className="w-4 h-4" />,
    label: "Service Page",
    onClick: () => navigate('/service-page')
  }, {
    icon: <CreditCard className="w-4 h-4" />,
    label: "Checkout"
  }, {
    icon: <Palette className="w-4 h-4" />,
    label: "Appearance"
  }, {
    icon: <MenuIcon className="w-4 h-4" />,
    label: "Menu"
  }];

  const sidebarItems = [{
    icon: <Home />,
    label: "Dashboard",
    onClick: () => handleMenuClick('dashboard')
  }, {
    icon: <Grid />,
    label: "Service Requests",
    onClick: () => navigate('/service-requests')
  }, {
    icon: <Package />,
    label: "Services",
    hasSubmenu: true,
    isOpen: isServicesOpen,
    submenuItems: serviceMenuItems,
    onClick: () => setIsServicesOpen(!isServicesOpen)
  }, {
    icon: <Users />,
    label: "Customers",
    onClick: () => navigate('/customers')
  }, {
    icon: <PenTool />,
    label: "Design",
    hasSubmenu: true,
    isOpen: isDesignOpen,
    submenuItems: designMenuItems,
    onClick: () => setIsDesignOpen(!isDesignOpen)
  }, {
    icon: <Settings />,
    label: "Settings"
  }];

  const premiumFeatures = [{
    icon: <Tag />,
    label: "Discounts",
    badge: "PREMIUM"
  }, {
    icon: <MessagesSquare />,
    label: "Reviews",
    badge: "PREMIUM"
  }, {
    icon: <BarChart />,
    label: "Analytics",
    badge: "PREMIUM"
  }, {
    icon: <ScrollText />,
    label: "Pages",
    badge: "PREMIUM"
  }, {
    icon: <CalendarClock />,
    label: "Booking",
    badge: "PREMIUM"
  }];

  const businessFeatures = [{
    icon: <MessageCircle />,
    label: "WhatsApp Business",
    badge: "BUSINESS"
  }, {
    icon: <Inbox />,
    label: "Inbox",
    badge: "BUSINESS"
  }, {
    icon: <BadgeDollarSign />,
    label: "Marketing"
  }];

  const setupSteps = [{
    number: 1,
    title: "Add your first product",
    action: "Add product",
    completed: true
  }, {
    number: 2,
    title: "Create your first order",
    action: "Create order",
    completed: false,
    onClick: () => navigate('/service-page')
  }, {
    number: 3,
    title: "Add delivery options",
    action: "Add delivery",
    completed: true
  }, {
    number: 4,
    title: "Set up payment methods",
    action: "Add payment",
    completed: false
  }, {
    number: 5,
    title: "Set up custom domain",
    action: "Upgrade",
    completed: false
  }, {
    number: 6,
    title: "Invite staff",
    action: "Upgrade",
    completed: false
  }];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 py-6">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" alt="Logo" className="h-8 w-8" />
            <div>
              <h2 className="font-semibold">KicksandSneakers</h2>
              <p className="text-sm text-gray-500">take.app/kicksandsneakers</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          {sidebarItems.map((item, index) => (
            <div key={`${item.label}-${index}`}>
              <button
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${
                  item.hasSubmenu && item.isOpen ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.hasSubmenu && (
                  item.isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {item.hasSubmenu && item.isOpen && (
                <div className="ml-9 mt-1 space-y-1">
                  {item.submenuItems?.map((subItem, subIndex) => (
                    <button
                      key={`${subItem.label}-${subIndex}`}
                      onClick={subItem.onClick}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                    >
                      {subItem.icon}
                      {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-8">
          <p className="px-6 text-xs font-medium text-gray-400 uppercase mb-2">Apps</p>
          <nav className="space-y-1 px-3">
            {[...premiumFeatures, ...businessFeatures].map(item => <a key={item.label} href="#" className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.badge && <span className={`text-xs px-2 py-1 rounded ${item.badge === "PREMIUM" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {item.badge}
                  </span>}
              </a>)}
          </nav>
        </div>
      </div>

      <div className="ml-64">
        <Header />
        <div className="p-8 pt-20">
          <div className="max-w-5xl mx-auto">
            {showCategories && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-gebeya-pink">Categories</h1>
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
                    <Button 
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add category
                    </Button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-100">
                  {categories.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No categories found. Create your first category to get started.
                    </div>
                  ) : (
                    categories.map((category) => (
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
                    ))
                  )}
                </div>

                <CreateCategoryDialog
                  isOpen={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                  categoryName={newCategoryName}
                  onCategoryNameChange={setNewCategoryName}
                  onCreateCategory={createCategory}
                />

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
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4">Services</h2>
                {services.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No services found. Add your first service to get started.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map(service => (
                      <div key={service.id} className="p-4 border rounded-lg">
                        <h3 className="font-medium">{service.name}</h3>
                        <p className="text-gray-600">${service.price}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
