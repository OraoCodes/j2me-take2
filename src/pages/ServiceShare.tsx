
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Link2, Instagram, Facebook, MessageCircle, Settings, ArrowLeft, Copy, CheckCheck } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ServiceShare = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const serviceLink = "https://yourplatform.co/yourname";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(serviceLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "The service link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareOnSocial = (platform: string) => {
    let url = "";
    switch (platform) {
      case "instagram":
        // Since Instagram doesn't have a direct share URL, we'll copy the link
        copyToClipboard();
        toast({
          title: "Ready to share on Instagram",
          description: "The link has been copied. You can now paste it in your Instagram bio.",
        });
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(serviceLink)}`;
        window.open(url, "_blank");
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodeURIComponent(
          "Check out my service page: " + serviceLink
        )}`;
        window.open(url, "_blank");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Share Your Service Page
          </h1>
          <p className="text-gray-600 text-lg">
            Make your services visible on social media and attract more clients.
          </p>
        </div>

        {/* Service Link Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <Link2 className="w-6 h-6 text-gebeya-pink" />
            <h2 className="text-lg font-semibold">Your Service Link</h2>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={serviceLink}
              readOnly
              className="flex-1 p-3 bg-gray-50 rounded-lg text-gray-700 font-medium"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex gap-2 items-center hover:bg-gray-50"
            >
              {copied ? (
                <CheckCheck className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Copy
            </Button>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => shareOnSocial("instagram")}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 flex gap-3 items-center justify-center h-12"
          >
            <Instagram className="w-5 h-5" />
            Add to Instagram Bio
          </Button>
          
          <Button
            onClick={() => shareOnSocial("facebook")}
            className="w-full bg-[#1877F2] hover:opacity-90 flex gap-3 items-center justify-center h-12"
          >
            <Facebook className="w-5 h-5" />
            Share on Facebook
          </Button>
          
          <Button
            onClick={() => shareOnSocial("whatsapp")}
            className="w-full bg-[#25D366] hover:opacity-90 flex gap-3 items-center justify-center h-12"
          >
            <MessageCircle className="w-5 h-5" />
            Share on WhatsApp
          </Button>
        </div>

        {/* Settings and Dashboard Buttons */}
        <div className="mt-12 space-y-4">
          <Button
            onClick={() => navigate("/settings")}
            variant="outline"
            className="w-full flex gap-2 items-center justify-center h-12 border-gebeya-pink text-gebeya-pink hover:bg-pink-50"
          >
            <Settings className="w-5 h-5" />
            Setup Wizard
          </Button>
          
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="w-full flex gap-2 items-center justify-center h-12 text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceShare;
