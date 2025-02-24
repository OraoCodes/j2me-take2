
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Import, Filter, ArrowUpDown, FileExport, Info, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  description: string | null;
  image_url: string | null;
}

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

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

  const handleDelete = async (id: string) => {
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

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="p-8 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">Services</h1>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manage your services</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline">
                <Import className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline">
                Bulk edit
              </Button>
              <Button onClick={() => navigate('/create-service')}>
                <Plus className="w-4 h-4 mr-2" />
                Add service
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by service name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <FileExport className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="divide-y">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="p-4 flex items-center hover:bg-gray-50"
                >
                  <input type="checkbox" className="mr-4" />
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
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-gray-500">KSh {service.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                    <span className={`px-2 py-1 rounded text-xs ${
                      service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.is_active ? 'VISIBLE' : 'HIDDEN'}
                    </span>
                  </div>
                </div>
              ))}
              {filteredServices.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No services found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
