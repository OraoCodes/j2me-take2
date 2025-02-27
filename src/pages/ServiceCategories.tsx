
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Info, GripVertical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CategoryItem } from "@/components/categories/CategoryItem";
import { CreateCategoryDialog } from "@/components/categories/CreateCategoryDialog";
import { 
  fetchCategories, 
  createCategory, 
  updateCategory, 
  toggleCategoryVisibility,
  updateCategoriesSequence
} from "@/utils/categoryUtils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

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
  const [isReordering, setIsReordering] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategoriesData();
  }, []);

  const fetchCategoriesData = async () => {
    const data = await fetchCategories();
    setCategories(data);
  };

  const handleCreateCategory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const success = await createCategory(newCategoryName, user.id, categories);
    if (success) {
      setNewCategoryName("");
      setIsDialogOpen(false);
      fetchCategoriesData();
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

    const success = await updateCategory(editingId, editingName);
    if (success) {
      setEditingId(null);
      setEditingName("");
      fetchCategoriesData();
    }
  };

  const toggleVisibility = async (category: Category) => {
    const success = await toggleCategoryVisibility(category);
    if (success) {
      fetchCategoriesData();
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const reorderedCategories = Array.from(filteredCategories);
    const [movedItem] = reorderedCategories.splice(result.source.index, 1);
    reorderedCategories.splice(result.destination.index, 0, movedItem);
    
    // Update sequence numbers for all categories based on their new positions
    const updatedCategories = reorderedCategories.map((category, index) => ({
      ...category,
      sequence: index
    }));
    
    // Optimistically update the UI
    const newCategories = [...categories];
    updatedCategories.forEach(updatedCat => {
      const index = newCategories.findIndex(cat => cat.id === updatedCat.id);
      if (index !== -1) {
        newCategories[index] = updatedCat;
      }
    });
    setCategories(newCategories);
    
    // Update in the database
    const success = await updateCategoriesSequence(updatedCategories);
    if (!success) {
      // Revert to original data if update fails
      fetchCategoriesData();
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category sequence. Please try again.",
      });
    } else {
      toast({
        title: "Success",
        description: "Category sequence updated successfully.",
      });
    }
  };

  const toggleReordering = () => {
    setIsReordering(!isReordering);
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
              className={`border-gebeya-purple text-gebeya-purple hover:bg-gebeya-purple/10 ${isReordering ? 'bg-gebeya-purple/10' : ''}`}
              onClick={toggleReordering}
            >
              {isReordering ? "Done reordering" : "Change sequence"}
            </Button>
            <CreateCategoryDialog
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              categoryName={newCategoryName}
              onCategoryNameChange={setNewCategoryName}
              onCreateCategory={handleCreateCategory}
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
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gebeya-pink data-[state=active]:to-gebeya-orange data-[state=active]:text-white"
            >
              Visible
            </TabsTrigger>
            <TabsTrigger 
              value="hidden"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gebeya-pink data-[state=active]:to-gebeya-orange data-[state=active]:text-white"
            >
              Hidden
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visible" className="mt-6">
            <div className="bg-white rounded-lg shadow-lg border border-gebeya-purple/10">
              {isReordering ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="categories">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {filteredCategories.map((category, index) => (
                          <Draggable key={category.id} draggableId={category.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                                  </div>
                                  <span>{category.name}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  Sequence: {category.sequence}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <>
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
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="hidden" className="mt-6">
            <div className="bg-white rounded-lg shadow-lg border border-gebeya-purple/10">
              {isReordering ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="hidden-categories">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                      >
                        {filteredCategories.map((category, index) => (
                          <Draggable key={category.id} draggableId={category.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div {...provided.dragHandleProps}>
                                    <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                                  </div>
                                  <span>{category.name}</span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  Sequence: {category.sequence}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <>
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
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceCategories;
