
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ShareLinks } from "./marketing/ShareLinks";
import { QRCodeSection } from "./marketing/QRCodeSection";
import { MetaTags } from "../shared/MetaTags";
import { generateQRCodeUrl, createStyledQRCode } from "@/utils/qrCode";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const Marketing = () => {
  const [storeUrl, setStoreUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState("My Business");
  const [profileImage, setProfileImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStoreUrl = async () => {
      try {
        // First get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }
        
        if (user) {
          // Set a default store URL with the user ID
          setStoreUrl(`/services/${user.id}`);
          
          // Then try to fetch the profile data
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('company_name, profile_image_url')
              .eq('id', user.id)
              .single();

            if (profileError) {
              console.error("Error fetching profile:", profileError);
              // Continue anyway, we already have default values
            }

            if (profile?.company_name) {
              setBusinessName(profile.company_name);
            }

            if (profile?.profile_image_url) {
              setProfileImage(profile.profile_image_url);
            }
          } catch (profileError) {
            console.error("Error in profile fetch:", profileError);
            // Continue with defaults
          }
        } else {
          setError("No user found. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching store URL:", error);
        setError("Failed to load marketing data. Please try refreshing the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreUrl();
  }, []);

  // Generate the absolute URL to ensure it works when deployed
  // Handle both local development and production URLs correctly
  const getFullUrl = () => {
    if (!storeUrl) return window.location.origin;
    
    // For Netlify deployments, use their environment variable if available
    const netlifyUrl = process.env.REACT_APP_URL || 
                       process.env.NETLIFY_URL || 
                       window.location.origin;
    
    // Ensure we have a clean base URL without trailing slashes
    const baseUrl = netlifyUrl.endsWith('/') 
      ? netlifyUrl.slice(0, -1) 
      : netlifyUrl;
    
    // Ensure store URL starts with a slash
    const formattedStoreUrl = storeUrl.startsWith('/') 
      ? storeUrl 
      : `/${storeUrl}`;
    
    return `${baseUrl}${formattedStoreUrl}`;
  };
  
  const fullUrl = getFullUrl();
  
  // Log the URL for debugging
  console.log("Generated full URL for sharing:", fullUrl);

  const copyToClipboard = () => {
    // Make sure to use the full URL when copying
    navigator.clipboard.writeText(getFullUrl());
    toast({
      title: "Link copied!",
      description: "The URL has been copied to your clipboard.",
    });
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
    try {
      const qrUrl = generateQRCodeUrl(fullUrl);
      await createStyledQRCode(qrUrl, businessName, fullUrl);
      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been successfully downloaded.",
      });
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your QR code.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadStyledQR = async () => {
    try {
      const qrUrl = generateQRCodeUrl(fullUrl);
      await createStyledQRCode(qrUrl, businessName, fullUrl);
      toast({
        title: "Styled QR Code Downloaded",
        description: "Your styled QR code has been successfully downloaded.",
      });
    } catch (error) {
      console.error("Error downloading styled QR code:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading your styled QR code.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-semibold">Marketing</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg w-full"></div>
          <div className="h-64 bg-gray-200 rounded-lg w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-semibold">Marketing</h1>
        </div>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center p-8">
          <p>Please try refreshing the page or contact support if the issue persists.</p>
        </div>
      </div>
    );
  }

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
        storeUrl={fullUrl}
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
