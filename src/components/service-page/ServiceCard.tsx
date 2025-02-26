
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
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer max-w-sm"
      onClick={onServiceSelect}
    >
      <div className="aspect-[16/9] relative group">
        {(service.image_url || serviceImages.length > 0) && (
          <>
            <img
              src={serviceImages[selectedImageIndex]?.image_url || service.image_url}
              alt={service.name}
              className="w-full h-full object-cover"
            />
            {serviceImages.length > 1 && (
              <div className="absolute bottom-1 right-1 flex gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageNavigation('prev');
                  }}
                  className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageNavigation('next');
                  }}
                  className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-base leading-tight">{service.name}</h3>
            {service.service_categories && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full inline-block mt-1">
                {service.service_categories.name}
              </span>
            )}
          </div>
          <p className="font-bold text-gebeya-pink whitespace-nowrap text-sm">
            KSh {service.price.toLocaleString()}
          </p>
        </div>
        {service.description && (
          <p className="text-gray-600 text-xs mt-1.5 line-clamp-2">{service.description}</p>
        )}
        <Button
          className="mt-2 w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90 transition-opacity text-sm h-8 px-3"
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
