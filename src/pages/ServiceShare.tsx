import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { useNavigate } from "react-router-dom";
import { Link2, Instagram, Facebook, MessageCircle, ArrowRight, Copy, CheckCheck, QrCode, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateQRCodeUrl, downloadQRCode, createStyledQRCode } from "@/utils/qrCode";

const ServiceShare = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [serviceLink, setServiceLink] = useState("");
  const [businessName, setBusinessName] = useState("My Business");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('service_page_link, company_name')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const link = profile?.service_page_link || `${window.location.origin}/services/${user.id}`;
        setServiceLink(link);
        
        if (profile?.company_name) {
          setBusinessName(profile.company_name);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast({
          title: "Error loading profile",
          description: "Could not load your service page link.",
          variant: "destructive",
        });
      }
    };

    fetchUserProfile();
  }, [navigate, toast]);

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
        copyToClipboard();
        window.open("https://www.instagram.com/accounts/edit", "_blank");
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

  const handleDownloadQR = async () => {
    try {
      const qrUrl = generateQRCodeUrl(serviceLink);
      await downloadQRCode(qrUrl, 'service-qr-code.png');
      toast({
        title: "QR Code downloaded",
        description: "Simple QR code has been downloaded successfully.",
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "There was a problem downloading your QR code.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadStyledQR = async () => {
    try {
      const qrUrl = generateQRCodeUrl(serviceLink);
      await createStyledQRCode(qrUrl, businessName, serviceLink);
      toast({
        title: "Styled QR Code downloaded",
        description: "Your branded QR code has been downloaded successfully.",
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "There was a problem creating your styled QR code.",
        variant: "destructive",
      });
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

        {/* QR Code Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <QrCode className="w-6 h-6 text-gebeya-pink" />
            <h2 className="text-lg font-semibold">QR Code</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg flex justify-center">
                <img 
                  src={generateQRCodeUrl(serviceLink)}
                  alt="QR Code"
                  className="w-40 h-40"
                />
              </div>
              <Button 
                onClick={handleDownloadQR} 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Simple QR
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange p-4 rounded-lg flex flex-col items-center space-y-2">
                <h3 className="text-white text-xl font-bold">SCAN ME</h3>
                <div className="bg-white p-3 rounded-lg">
                  <img 
                    src={generateQRCodeUrl(serviceLink)}
                    alt="Styled QR Code"
                    className="w-32 h-32"
                  />
                </div>
                <p className="text-white font-semibold text-lg">{businessName}</p>
              </div>
              <Button 
                onClick={handleDownloadStyledQR} 
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Styled QR
              </Button>
            </div>
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

        {/* Dashboard Button */}
        <div className="mt-12">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            className="w-full flex gap-2 items-center justify-center h-12 text-gray-600 hover:bg-gray-50"
          >
            Proceed to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceShare;
