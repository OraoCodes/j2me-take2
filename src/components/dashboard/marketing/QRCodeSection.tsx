
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
  const qrCodeUrl = generateQRCodeUrl(fullUrl);

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
            <div className="bg-gray-50 p-8 rounded-lg flex justify-center">
              <img 
                src={qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={onDownloadSimple}>
                <Download className="h-4 w-4 mr-2" />
                Download Simple QR
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange p-8 rounded-lg flex flex-col items-center space-y-4">
              <h3 className="text-white text-2xl font-bold">SCAN ME</h3>
              <p className="text-white text-sm">TO VISIT OUR WEBSITE</p>
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={qrCodeUrl}
                  alt="Styled QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-white font-semibold text-xl">{businessName}</p>
              <p className="text-white text-sm max-w-[250px] truncate">{fullUrl}</p>
              <img 
                src="/lovable-uploads/14afcb65-2dcb-477c-8c08-3ae4cd079ee7.png"
                alt="Gebeya Logo"
                className="h-8 mt-2"
              />
            </div>
            <div className="flex justify-center">
              <Button variant="outline" onClick={onDownloadStyled}>
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
