
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const fetchServices = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
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

    return servicesData || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to fetch services. Please try again.",
    });
    return [];
  }
};

export const deleteService = async (id: string) => {
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
    return false;
  }

  toast({
    title: "Success",
    description: "Service deleted successfully.",
  });
  return true;
};

export const updateServiceCategory = async (serviceId: string, categoryId: string) => {
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
    return false;
  }

  toast({
    title: "Success",
    description: "Service category updated successfully.",
  });
  return true;
};
