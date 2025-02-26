
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface BusinessProfileProps {
  businessName: string;
  profileImage: string;
  onShare: () => void;
}

export const BusinessProfile: React.FC<BusinessProfileProps> = ({
  businessName,
  profileImage,
  onShare,
}) => {
  return (
    <div className="text-center mb-6">
      <div className="inline-block">
        <img
          src={profileImage || '/placeholder.svg'}
          alt={businessName}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
        />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{businessName}</h1>
      <p className="text-gray-600 mt-2">Available Services</p>
      
      <Button
        onClick={onShare}
        className="mt-4 bg-[#25D366] hover:bg-[#128C7E] text-white w-full sm:w-auto"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share on WhatsApp
      </Button>
    </div>
  );
};
