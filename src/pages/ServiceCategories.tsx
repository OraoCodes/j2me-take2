
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CategoryItem } from "@/components/categories/CategoryItem";
import { CreateCategoryDialog } from "@/components/categories/CreateCategoryDialog";

interface Category {
  id: string;
  name: string;
  is_visible: boolean;
  sequence: number;
  user_id: string;
  created_at: string;
}

const ServiceCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visible");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
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

  const filteredCategories = categories.filter(category => 
    activeTab === "visible" ? category.is_visible : !category.is_visible
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-pink-50">
      <Header />
      <div className="container mx-auto px-4 pt-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-gebeya-purple">Category</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gebeya-purple/60 hover:text-gebeya-purple transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-white border-gebeya-purple/20">
                  <p className="text-gebeya-purple">Organize your services into categories</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="border-gebeya-purple text-gebeya-purple hover:bg-gebeya-purple/10"
            >
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

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="bg-white border border-gebeya-purple/20">
            <TabsTrigger 
              value="visible"
              className="data-[state=active]:bg-gebeya-purple data-[state=active]:text-white"
            >
              Visible
            </TabsTrigger>
            <TabsTrigger 
              value="hidden"
              className="data-[state=active]:bg-gebeya-purple data-[state=active]:text-white"
            >
              Hidden
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visible" className="mt-6">
            <div className="bg-white rounded-lg shadow-lg border border-gebeya-purple/10">
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
              {filteredCategories.length === 0 && (
                <div className="p-8 text-center text-gebeya-purple/60">
                  No visible categories found
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hidden" className="mt-6">
            <div className="bg-white rounded-lg shadow-lg border border-gebeya-purple/10">
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
              {filteredCategories.length === 0 && (
                <div className="p-8 text-center text-gebeya-purple/60">
                  No hidden categories found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceCategories;
