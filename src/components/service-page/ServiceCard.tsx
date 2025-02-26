
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Service } from '@/types/dashboard';
import { ServiceImage } from '@/types/dashboard';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
  };

  return (
    <>
      {/* Mobile View (Horizontal Card) */}
      <Card 
        className="sm:hidden overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="flex h-32">
          <div className="w-1/3 relative">
            <img
              src={serviceImages[selectedImageIndex]?.image_url || service.image_url}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-2/3 p-3 flex flex-col">
            <div className="flex-1">
              <h3 className="font-semibold text-base leading-tight mb-1">{service.name}</h3>
              <p className="font-bold text-gebeya-pink text-sm">
                KSh {service.price.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleViewClick}
              >
                View
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onServiceSelect();
                }}
              >
                Request
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Desktop/Tablet View (Vertical Card) */}
      <Card 
        className="hidden sm:block overflow-hidden hover:shadow-lg transition-shadow cursor-pointer max-w-sm"
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

      {/* Expanded View Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="space-y-4">
            <div className="aspect-[16/9] relative">
              <img
                src={serviceImages[selectedImageIndex]?.image_url || service.image_url}
                alt={service.name}
                className="w-full h-full object-cover rounded-lg"
              />
              {serviceImages.length > 1 && (
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    onClick={() => onImageNavigation('prev')}
                    className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onImageNavigation('next')}
                    className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">{service.name}</h3>
              {service.service_categories && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1">
                  {service.service_categories.name}
                </span>
              )}
              <p className="font-bold text-gebeya-pink text-lg mt-2">
                KSh {service.price.toLocaleString()}
              </p>
            </div>

            {service.description && (
              <p className="text-gray-600 text-sm">{service.description}</p>
            )}

            <Button
              className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90 transition-opacity"
              onClick={(e) => {
                setIsExpanded(false);
                onServiceSelect();
              }}
            >
              Request Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
