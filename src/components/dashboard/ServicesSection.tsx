
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Filter, ArrowUpDown, FileDown, Plus, Trash2, Edit } from "lucide-react";
import { Service } from "@/types/dashboard";
import CreateService from "@/pages/CreateService";
import { fetchServices } from "@/utils/serviceUtils";

interface ServicesSectionProps {
  services: Service[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userCategories: any[];
  onDeleteService: (id: string) => void;
  onUpdateServiceCategory: (serviceId: string, categoryId: string) => void;
  setShowCreateService: (show: boolean) => void;
}

export const ServicesSection = ({
  services,
  searchQuery,
  setSearchQuery,
  userCategories,
  onDeleteService,
  onUpdateServiceCategory,
  setShowCreateService
}: ServicesSectionProps) => {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showServices, setShowServices] = useState(true);
  const [localServices, setLocalServices] = useState<Service[]>(services);

  useEffect(() => {
    setLocalServices(services);
  }, [services]);

  const handleCreateServiceSuccess = async () => {
    setShowServices(true);
    setShowCreateService(false);
    // Fetch updated services list
    const updatedServices = await fetchServices();
    setLocalServices(updatedServices);
  };

  if (!showServices) {
    return (
      <CreateService 
        onSuccess={handleCreateServiceSuccess}
      />
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gebeya-pink">Services</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowServices(false)} 
            className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add service
          </Button>
        </div>
      </div>

      {editingService && (
        <div className="mb-8">
          <CreateService
            initialData={editingService}
            onSuccess={async () => {
              setEditingService(null);
              // Fetch updated services list after editing
              const updatedServices = await fetchServices();
              setLocalServices(updatedServices);
            }}
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="p-4 border-b">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input 
                type="text" 
                placeholder="Search by service name" 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="max-w-md focus:ring-gebeya-pink focus:border-gebeya-pink" 
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {localServices.map(service => (
            <div key={service.id} className="p-4 flex items-center hover:bg-gray-50/80">
              <input type="checkbox" className="mr-4 rounded border-gebeya-pink text-gebeya-pink focus:ring-gebeya-pink" />
              <div className="w-16 h-16 rounded bg-gray-100 mr-4">
                {service.image_url && (
                  <img src={service.image_url} alt={service.name} className="w-full h-full object-cover rounded" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{service.name}</h3>
                <p className="text-gebeya-pink font-medium">KSh {service.price.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-4">
                <Select 
                  defaultValue={service.category_id || ""} 
                  onValueChange={value => onUpdateServiceCategory(service.id, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {userCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setEditingService(service)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    onDeleteService(service.id);
                    // Update local services after deletion
                    setLocalServices(prevServices => 
                      prevServices.filter(s => s.id !== service.id)
                    );
                  }} 
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
