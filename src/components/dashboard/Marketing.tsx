
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ShareLinks } from "./marketing/ShareLinks";
import { QRCodeSection } from "./marketing/QRCodeSection";
import { MetaTags } from "../shared/MetaTags";
import { generateQRCodeUrl, createStyledQRCode } from "@/utils/qrCode";

export const Marketing = () => {
  const [storeUrl, setStoreUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const fetchStoreUrl = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setStoreUrl(`/services/${user.id}`);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name, profile_image_url')
          .eq('id', user.id)
          .single();

        if (profile?.company_name) {
          setBusinessName(profile.company_name);
        } else {
          setBusinessName("My Business");
        }

        if (profile?.profile_image_url) {
          setProfileImage(profile.profile_image_url);
        }
      }
      setLoading(false);
    };

    fetchStoreUrl();
  }, []);

  // Generate the absolute URL to ensure it works when deployed
  const fullUrl = `${window.location.origin}${storeUrl}`;
  
  // Log the URL for debugging
  console.log("Generated full URL for sharing:", fullUrl);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`${window.location.origin}${text}`);
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleInstagramEdit = () => {
    window.open('https://www.instagram.com/accounts/edit', '_blank', 'noopener,noreferrer');
  };

  const handleDownloadQR = async () => {
    const qrUrl = generateQRCodeUrl(fullUrl);
    // Using createStyledQRCode with a simpler name for the basic QR code
    await createStyledQRCode(qrUrl, businessName, fullUrl);
  };

  const handleDownloadStyledQR = async () => {
    const qrUrl = generateQRCodeUrl(fullUrl);
    await createStyledQRCode(qrUrl, businessName, fullUrl);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <MetaTags
        title={`${businessName} - Services`}
        description={`Check out our services at ${businessName}`}
        imageUrl={profileImage}
        url={fullUrl}
      />

      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold">Marketing</h1>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="h-5 w-5 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Share your service page and increase visibility</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <ShareLinks
        storeUrl={storeUrl}
        onCopy={copyToClipboard}
        onFacebookShare={handleFacebookShare}
        onInstagramEdit={handleInstagramEdit}
      />

      <QRCodeSection
        fullUrl={fullUrl}
        businessName={businessName}
        onDownloadSimple={handleDownloadQR}
        onDownloadStyled={handleDownloadStyledQR}
      />
    </div>
  );
};
