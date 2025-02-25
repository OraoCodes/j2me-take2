import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, HelpCircle, Download, Instagram, Facebook } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";

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

  const copyToClipboard = (text: string) => {
    const fullUrl = `${window.location.origin}${text}`;
    navigator.clipboard.writeText(fullUrl);
  };

  const handleFacebookShare = () => {
    const fullUrl = `${window.location.origin}${storeUrl}`;
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
    const fullUrl = `${window.location.origin}${storeUrl}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}`;
    
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'service-qr-code.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading QR code:', error);
    }
  };

  const handleDownloadStyledQR = async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = 600;
      canvas.height = 800;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 60px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN ME', canvas.width / 2, 100);
      
      ctx.font = '24px Arial';
      ctx.fillText('TO VISIT OUR WEBSITE', canvas.width / 2, 140);

      const fullUrl = `${window.location.origin}${storeUrl}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`;
      const qrImage = new Image();
      
      qrImage.crossOrigin = 'anonymous';
      qrImage.src = qrUrl;
      
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
      });

      const qrSize = 300;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = 200;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
      
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(businessName, canvas.width / 2, qrY + qrSize + 60);

      ctx.font = '20px Arial';
      ctx.fillText(`${window.location.origin}${storeUrl}`, canvas.width / 2, canvas.height - 40);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'styled-qr-code.png';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 'image/png');
    } catch (error) {
      console.error('Error creating styled QR code:', error);
    }
  };

  const metaTags = (
    <Helmet>
      <title>{`${businessName} - Services`}</title>
      <meta name="description" content={`Check out our services at ${businessName}`} />
      <meta property="og:title" content={`${businessName} - Services`} />
      <meta property="og:description" content={`Check out our services at ${businessName}`} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`${window.location.origin}${storeUrl}`} />
      {profileImage && (
        <meta 
          property="og:image" 
          content={profileImage.startsWith('http') ? profileImage : `${window.location.origin}${profileImage}`} 
        />
      )}
      {profileImage && (
        <meta 
          name="twitter:image" 
          content={profileImage.startsWith('http') ? profileImage : `${window.location.origin}${profileImage}`} 
        />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${businessName} - Services`} />
      <meta name="twitter:description" content={`Check out our services at ${businessName}`} />
    </Helmet>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {metaTags}

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

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Share your Service Page Link</CardTitle>
          <CardDescription>
            Make your service page visible on your social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 truncate">{window.location.origin}{storeUrl}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(storeUrl)}
              className="flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Instagram className="h-6 w-6 text-gray-600" />
            <span className="flex-1">Add link in bio</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleInstagramEdit}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Link
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Facebook className="h-6 w-6 text-gray-600" />
            <span className="flex-1">Share on Facebook</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleFacebookShare}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Download QR code</CardTitle>
          <CardDescription>
            Get your QR code ready for your physical stores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-8 rounded-lg flex justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}${storeUrl}`)}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleDownloadQR}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Simple QR
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black p-8 rounded-lg flex flex-col items-center space-y-4">
                <h3 className="text-white text-2xl font-bold">SCAN ME</h3>
                <p className="text-white text-sm">TO VISIT OUR WEBSITE</p>
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}${storeUrl}`)}`}
                    alt="Styled QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-white font-semibold text-xl">{businessName}</p>
                <p className="text-white text-sm max-w-[250px] truncate">{window.location.origin}{storeUrl}</p>
              </div>
              <div className="flex justify-center">
                <Button variant="outline" onClick={handleDownloadStyledQR}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Styled QR
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
