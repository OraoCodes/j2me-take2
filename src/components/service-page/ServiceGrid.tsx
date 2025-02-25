
import { Card, CardContent } from '@/components/ui/card';
import { Service } from '@/types/dashboard';

interface ServiceImage {
  id: string;
  service_id: string;
  image_url: string;
  sequence: number;
}

interface ServiceGridProps {
  services: Service[];
  serviceImages: { [key: string]: ServiceImage[] };
  selectedImageIndex: { [key: string]: number };
  handleImageNavigation: (serviceId: string, direction: 'prev' | 'next') => void;
  onServiceSelect: (service: Service) => void;
}

export const ServiceGrid = ({
  services,
  serviceImages,
  selectedImageIndex,
  handleImageNavigation,
  onServiceSelect
}: ServiceGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <Card 
          key={service.id} 
          className="overflow-hidden hover:shadow-lg transition-shadow relative flex flex-col"
        >
          {(service.image_url || (serviceImages[service.id] && serviceImages[service.id].length > 0)) && (
            <div className="relative aspect-video">
              <img
                src={serviceImages[service.id]?.[selectedImageIndex[service.id] || 0]?.image_url || service.image_url}
                alt={service.name}
                className="w-full h-full object-cover"
              />
              {serviceImages[service.id]?.length > 1 && (
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageNavigation(service.id, 'prev');
                    }}
                    className="bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageNavigation(service.id, 'next');
                    }}
                    className="bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}
          <CardContent className="p-4 flex-1 flex flex-col">
            <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
            {service.description && (
              <p className="text-gray-600 text-sm mb-4 flex-1">{service.description}</p>
            )}
            <div className="flex items-center justify-between mt-auto">
              <p className="font-bold text-gebeya-pink">
                KSh {service.price.toLocaleString()}
              </p>
              {service.service_categories && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {service.service_categories.name}
                </span>
              )}
            </div>
            <button
              onClick={() => onServiceSelect(service)}
              className="mt-4 w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white py-2 rounded-md hover:opacity-90 transition-opacity"
            >
              Request Service
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
