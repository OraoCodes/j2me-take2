
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Service } from '@/types/dashboard';
import { ServiceImage } from '@/types/dashboard';

interface ServiceCardProps {
  service: Service;
  serviceImages: ServiceImage[];
  selectedImageIndex: number;
  onImageNavigation: (direction: 'prev' | 'next') => void;
  onServiceSelect: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  serviceImages,
  selectedImageIndex,
  onImageNavigation,
  onServiceSelect,
}) => {
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onServiceSelect}
    >
      <div className="aspect-[4/3] relative group">
        {(service.image_url || serviceImages.length > 0) && (
          <>
            <img
              src={serviceImages[selectedImageIndex]?.image_url || service.image_url}
              alt={service.name}
              className="w-full h-full object-cover"
            />
            {serviceImages.length > 1 && (
              <div className="absolute bottom-2 right-2 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageNavigation('prev');
                  }}
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageNavigation('next');
                  }}
                  className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-lg">{service.name}</h3>
            {service.service_categories && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                {service.service_categories.name}
              </span>
            )}
          </div>
          <p className="font-bold text-gebeya-pink whitespace-nowrap">
            KSh {service.price.toLocaleString()}
          </p>
        </div>
        {service.description && (
          <p className="text-gray-600 text-sm mt-2 line-clamp-2">{service.description}</p>
        )}
        <Button
          className="mt-4 w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onServiceSelect();
          }}
        >
          Request Service
        </Button>
      </CardContent>
    </Card>
  );
};
