
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Instagram, Facebook } from "lucide-react";

interface ShareLinksProps {
  storeUrl: string;
  onCopy: (text: string) => void;
  onFacebookShare: () => void;
  onInstagramEdit: () => void;
}

export const ShareLinks = ({
  storeUrl,
  onCopy,
  onFacebookShare,
  onInstagramEdit,
}: ShareLinksProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Share your Service Page Link</CardTitle>
        <CardDescription>
          Make your service page visible on your social media
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 flex items-center gap-3 min-w-0 w-full">
            <ExternalLink className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 truncate text-sm md:text-base">{window.location.origin}{storeUrl}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onCopy(storeUrl)}
            className="w-full md:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 flex-1 w-full">
            <Instagram className="h-6 w-6 text-gray-600" />
            <span className="flex-1">Add link in bio</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onInstagramEdit}
            className="w-full md:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Link
          </Button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3 flex-1 w-full">
            <Facebook className="h-6 w-6 text-gray-600" />
            <span className="flex-1">Share on Facebook</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onFacebookShare}
            className="w-full md:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
