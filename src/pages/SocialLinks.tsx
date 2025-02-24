
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Instagram, Facebook, WhatsApp, MapPin, Link2 } from "lucide-react";

interface SocialLink {
  id: string;
  name: string;
  icon: JSX.Element;
  enabled: boolean;
}

const SocialLinks = () => {
  const navigate = useNavigate();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="w-6 h-6 text-[#E4405F]" />,
      enabled: false,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="w-6 h-6 text-[#1877F2]" />,
      enabled: false,
    },
    {
      id: "whatsapp",
      name: "WhatsApp group",
      icon: <WhatsApp className="w-6 h-6 text-[#25D366]" />,
      enabled: false,
    },
    {
      id: "telegram",
      name: "Telegram group",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#229ED9">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.24-.02.27z" />
        </svg>
      ),
      enabled: false,
    },
    {
      id: "googlemap",
      name: "Google map",
      icon: <MapPin className="w-6 h-6 text-[#EA4335]" />,
      enabled: false,
    },
    {
      id: "tiktok",
      name: "Tiktok",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="black">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      ),
      enabled: false,
    },
    {
      id: "youtube",
      name: "Youtube",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF0000">
          <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.9 3.6 12 3.6 12 3.6s-7.9 0-9.5.5c-1 .3-1.7 1.1-2 2.1C0 7.9 0 12 0 12s0 4.1.5 5.8c.3 1 1 1.8 2 2.1 1.6.5 9.5.5 9.5.5s7.9 0 9.5-.5c1-.3 1.7-1.1 2-2.1.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8z" />
          <path fill="#FFF" d="M9.6 15.6V8.4l6.4 3.6z" />
        </svg>
      ),
      enabled: false,
    },
    {
      id: "link",
      name: "Link",
      icon: <Link2 className="w-6 h-6 text-gray-700" />,
      enabled: false,
    },
  ]);

  const toggleSocialLink = (id: string) => {
    setSocialLinks(links =>
      links.map(link =>
        link.id === id ? { ...link, enabled: !link.enabled } : link
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${step === 3
                    ? "border-gebeya-pink bg-white text-gebeya-pink"
                    : step < 3
                    ? "border-gebeya-pink bg-gebeya-pink text-white"
                    : "border-gray-200 text-gray-400"
                  }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Add social media and important links</h1>
          <p className="text-gray-600 text-lg">
            Links will be added to your online store
          </p>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          {socialLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100"
            >
              <div className="flex items-center gap-3">
                {link.icon}
                <span className="font-medium">{link.name}</span>
              </div>
              <Switch
                checked={link.enabled}
                onCheckedChange={() => toggleSocialLink(link.id)}
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12">
          <Button
            onClick={() => {
              // Navigate to next page
            }}
            className="w-full h-12 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialLinks;
