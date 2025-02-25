
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, HelpCircle, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Marketing = () => {
  const [storeUrl, setStoreUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreUrl = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setStoreUrl(`https://take.app/${user.id}`); // This is an example URL format
      }
      setLoading(false);
    };

    fetchStoreUrl();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold">Marketing</h1>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="h-5 w-5 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Share your store and increase visibility</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Share your store link</CardTitle>
          <CardDescription>
            Make your store visible on your social media and website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1 flex items-center gap-3">
              <ExternalLink className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">{storeUrl}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(storeUrl)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <img src="/lovable-uploads/4dcc2955-5c1c-46a7-8326-d2457dc799e7.png" alt="Instagram" className="h-6 w-6" />
            <span className="flex-1">Add link in bio</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(storeUrl)}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <img src="/lovable-uploads/4dcc2955-5c1c-46a7-8326-d2457dc799e7.png" alt="Facebook" className="h-6 w-6" />
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
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-8 rounded-lg flex justify-center">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://example.com" 
              alt="QR Code"
              className="w-48 h-48"
            />
          </div>
          <div className="bg-gray-50 p-8 rounded-lg flex justify-center">
            <img 
              src="/lovable-uploads/4dcc2955-5c1c-46a7-8326-d2457dc799e7.png"
              alt="Styled QR Code"
              className="w-64"
            />
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Styled QR Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
