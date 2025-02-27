
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/dashboard";
import { toast } from "@/hooks/use-toast";

export const fetchCategories = async () => {
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
    return [];
  }
  return data as Category[];
};

export const createCategory = async (newCategoryName: string, userId: string, categories: Category[]) => {
  if (!newCategoryName.trim()) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Category name cannot be empty.",
    });
    return false;
  }

  const { error } = await supabase
    .from('service_categories')
    .insert([
      {
        name: newCategoryName.trim(),
        sequence: categories.length,
        user_id: userId
      }
    ]);

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to create category. Please try again.",
    });
    return false;
  }

  toast({
    title: "Success",
    description: "Category created successfully.",
  });
  return true;
};

export const updateCategory = async (categoryId: string, name: string) => {
  const { error } = await supabase
    .from('service_categories')
    .update({ name: name.trim() })
    .eq('id', categoryId);

  if (error) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to update category name. Please try again.",
    });
    return false;
  }

  toast({
    title: "Success",
    description: "Category updated successfully.",
  });
  return true;
};

export const toggleCategoryVisibility = async (category: Category) => {
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
    return false;
  }
  return true;
};

export const updateCategoriesSequence = async (categories: Category[]) => {
  try {
    // Update each category one by one instead of using RPC
    for (const category of categories) {
      const { error } = await supabase
        .from('service_categories')
        .update({ sequence: category.sequence })
        .eq('id', category.id);
        
      if (error) {
        console.error("Error updating category sequence:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating category sequences:", error);
    return false;
  }
};

export const deleteCategory = async (id: string) => {
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
    return false;
  }

  toast({
    title: "Success",
    description: "Category deleted successfully.",
  });
  return true;
};
