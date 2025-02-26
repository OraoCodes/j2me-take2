
import React from 'react';

interface ServiceBannerProps {
  bannerImage: string;
}

export const ServiceBanner: React.FC<ServiceBannerProps> = ({ bannerImage }) => {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-3xl relative">
        <div className="aspect-[21/9] sm:aspect-video">
          {bannerImage ? (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${bannerImage})`
                }}
              />
              <div className="absolute inset-0 bg-black/20" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-gebeya-pink to-gebeya-orange opacity-10" />
          )}
        </div>
      </div>
    </div>
  );
};
