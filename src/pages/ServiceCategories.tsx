
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 pt-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Category</h1>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Organize your services into categories</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline">Change sequence</Button>
            <CreateCategoryDialog
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              categoryName={newCategoryName}
              onCategoryNameChange={setNewCategoryName}
              onCreateCategory={createCategory}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="visible">Visible</TabsTrigger>
            <TabsTrigger value="hidden">Hidden</TabsTrigger>
          </TabsList>

          <TabsContent value="visible" className="mt-6">
            <div className="bg-white rounded-lg shadow">
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
            <div className="bg-white rounded-lg shadow">
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
      </div>
    </div>
  );
};

export default ServiceCategories;
