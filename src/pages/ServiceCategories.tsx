
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Info, DragHandleDots2Icon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Category {
  id: string;
  name: string;
  is_visible: boolean;
  sequence: number;
}

const ServiceCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visible");
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
      setCategories(data || []);
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

    const { error } = await supabase
      .from('service_categories')
      .insert([
        {
          name: newCategoryName.trim(),
          sequence: categories.length,
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create category</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Category name</Label>
                    <Input
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                    />
                  </div>
                  <Button onClick={createCategory} className="w-full">
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <DragHandleDots2Icon className="h-5 w-5 text-gray-400" />
                    <span>{category.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => toggleVisibility(category)}
                  >
                    Hide
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hidden" className="mt-6">
            <div className="bg-white rounded-lg shadow">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <DragHandleDots2Icon className="h-5 w-5 text-gray-400" />
                    <span>{category.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => toggleVisibility(category)}
                  >
                    Show
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceCategories;
