
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { generateQRCodeUrl } from "@/utils/qrCode";

interface QRCodeSectionProps {
  fullUrl: string;
  businessName: string;
  onDownloadSimple: () => void;
  onDownloadStyled: () => void;
}

export const QRCodeSection = ({
  fullUrl,
  businessName,
  onDownloadSimple,
  onDownloadStyled,
}: QRCodeSectionProps) => {
  // Generate QR code URL only if fullUrl is available
  const qrCodeUrl = fullUrl ? generateQRCodeUrl(fullUrl) : '';
  
  // Log the URL to help with debugging
  console.log("QR Code generated for URL:", fullUrl);

  return (
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
            <div className="bg-gray-50 p-4 md:p-8 rounded-lg flex justify-center">
              {fullUrl ? (
                <img 
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-36 h-36 md:w-48 md:h-48"
                />
              ) : (
                <div className="w-36 h-36 md:w-48 md:h-48 flex items-center justify-center text-gray-400">
                  Loading QR Code...
                </div>
              )}
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={onDownloadSimple} disabled={!fullUrl} className="w-full md:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download Simple QR
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange p-4 md:p-8 rounded-lg flex flex-col items-center space-y-4">
              <h3 className="text-white text-xl md:text-2xl font-bold">SCAN ME</h3>
              <p className="text-white text-xs md:text-sm">TO VISIT OUR WEBSITE</p>
              <div className="bg-white p-3 md:p-4 rounded-lg">
                {fullUrl ? (
                  <img 
                    src={qrCodeUrl}
                    alt="Styled QR Code"
                    className="w-36 h-36 md:w-48 md:h-48"
                  />
                ) : (
                  <div className="w-36 h-36 md:w-48 md:h-48 flex items-center justify-center text-gray-400">
                    Loading QR Code...
                  </div>
                )}
              </div>
              <p className="text-white font-semibold text-lg md:text-xl">{businessName}</p>
              <img 
                src="/lovable-uploads/14afcb65-2dcb-477c-8c08-3ae4cd079ee7.png"
                alt="Gebeya Logo"
                className="h-6 md:h-8 mt-2"
              />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={onDownloadStyled} disabled={!fullUrl} className="w-full md:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download Styled QR
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
