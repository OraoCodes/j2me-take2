
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import CreateService from "./CreateService";
import type { Database } from "@/integrations/supabase/types";

type Service = Database['public']['Tables']['services']['Row'];

const EditService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchService();
  }, [serviceId]);

  const fetchService = async () => {
    if (!serviceId) return;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load service details",
        variant: "destructive",
      });
      navigate('/dashboard');
    } else {
      setService(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gebeya-pink"></div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  return (
    <CreateService
      initialData={service}
      onSuccess={() => {
        toast({
          title: "Success",
          description: "Service updated successfully",
        });
        navigate('/dashboard');
      }}
    />
  );
};

export default EditService;
