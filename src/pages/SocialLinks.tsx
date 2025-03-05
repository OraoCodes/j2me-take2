import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Instagram, Facebook, MapPin, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface SocialLinkDetails {
  username?: string;
  url?: string;
  location?: string;
  title?: string;
}

interface SocialLink {
  id: string;
  name: string;
  icon: JSX.Element;
  enabled: boolean;
  details: SocialLinkDetails;
  inputType: "username" | "url" | "location" | "both";
  placeholder?: string;
  prefix?: string;
}

interface SocialLinkRecord {
  id: string;
  user_id: string;
  platform_id: string;
  enabled: boolean;
  username: string | null;
  url: string | null;
  location: string | null;
  title: string | null;
  created_at: string;
}

const SocialLinks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="w-6 h-6 text-[#E4405F]" />,
      enabled: false,
      details: { username: "" },
      inputType: "username",
      placeholder: "username",
      prefix: "@",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="w-6 h-6 text-[#1877F2]" />,
      enabled: false,
      details: { url: "" },
      inputType: "url",
      placeholder: "https://",
    },
    {
      id: "whatsapp",
      name: "WhatsApp group",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      enabled: false,
      details: { url: "" },
      inputType: "url",
      placeholder: "https://",
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
      details: { url: "" },
      inputType: "url",
      placeholder: "https://",
    },
    {
      id: "googlemap",
      name: "Google map",
      icon: <MapPin className="w-6 h-6 text-[#EA4335]" />,
      enabled: false,
      details: { location: "" },
      inputType: "location",
      placeholder: "Enter a location",
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
      details: { username: "" },
      inputType: "username",
      placeholder: "username",
      prefix: "@",
    },
    {
      id: "youtube",
      name: "Youtube",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF0000">
          <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.9 3.6 12 3.6 12 3.6s-7.9 0-9.5.5c-1 .3-1.7 1.1-2 2.1 1.6.5 9.5.5 9.5.5s7.9 0 9.5-.5c1-.3 1.7-1.1 2-2.1.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8z" />
          <path fill="#FFF" d="M9.6 15.6V8.4l6.4 3.6z" />
        </svg>
      ),
      enabled: false,
      details: { username: "" },
      inputType: "username",
      placeholder: "username",
      prefix: "@",
    },
    {
      id: "link",
      name: "Link",
      icon: <Link2 className="w-6 h-6 text-gray-700" />,
      enabled: false,
      details: { title: "", url: "" },
      inputType: "both",
      placeholder: "https://",
    },
  ]);

  useEffect(() => {
    loadSocialLinks();
  }, []);

  const loadSocialLinks = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('user_id', session.session.user.id)
        .returns<SocialLinkRecord[]>();

      if (error) throw error;

      if (data) {
        setSocialLinks(prevLinks => 
          prevLinks.map(link => {
            const savedData = data.find(item => item.platform_id === link.id);
            if (savedData) {
              return {
                ...link,
                enabled: savedData.enabled,
                details: {
                  username: savedData.username || "",
                  url: savedData.url || "",
                  location: savedData.location || "",
                  title: savedData.title || "",
                }
              };
            }
            return link;
          })
        );
      }
    } catch (error) {
      console.error('Error loading social links:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load social links.",
      });
    }
  };

  const saveSocialLinks = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        navigate('/auth');
        return;
      }

      const socialLinksData = socialLinks.map(link => ({
        user_id: session.session.user.id,
        platform_id: link.id,
        enabled: link.enabled,
        username: link.details.username || null,
        url: link.details.url || null,
        location: link.details.location || null,
        title: link.details.title || null,
      }));

      const { error } = await supabase
        .from('social_links')
        .upsert(socialLinksData, {
          onConflict: 'user_id,platform_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Social links saved successfully!",
      });

      navigate('/store-optimization');
    } catch (error) {
      console.error('Error saving social links:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save social links.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSocialLink = (id: string) => {
    setSocialLinks(links =>
      links.map(link =>
        link.id === id ? { ...link, enabled: !link.enabled } : link
      )
    );
  };

  const updateSocialLinkDetails = (id: string, details: Partial<SocialLinkDetails>) => {
    setSocialLinks(links =>
      links.map(link =>
        link.id === id ? { ...link, details: { ...link.details, ...details } } : link
      )
    );
  };

  const navigateBack = () => {
    navigate('/payment-methods');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
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

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Add social media and important links</h1>
          <p className="text-gray-600 text-lg">
            Links will be added to your online store
          </p>
        </div>

        <div className="space-y-4">
          {socialLinks.map((link) => (
            <div
              key={link.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {link.icon}
                  <span className="font-medium">{link.name}</span>
                </div>
                <Switch
                  checked={link.enabled}
                  onCheckedChange={() => toggleSocialLink(link.id)}
                />
              </div>
              
              {link.enabled && (
                <div className="border-t border-gray-100 p-4 space-y-4 animate-fade-in">
                  {(link.inputType === "both" || link.id === "link") && (
                    <div className="space-y-2">
                      <Label htmlFor={`${link.id}-title`}>Title</Label>
                      <Input
                        id={`${link.id}-title`}
                        value={link.details.title || ""}
                        onChange={(e) => updateSocialLinkDetails(link.id, { title: e.target.value })}
                        placeholder="Link"
                      />
                    </div>
                  )}
                  {(link.inputType === "username" || link.inputType === "url" || link.inputType === "both") && (
                    <div className="space-y-2">
                      <Label htmlFor={`${link.id}-input`}>
                        {link.inputType === "username" ? "Username" : "URL"}
                      </Label>
                      <div className="relative">
                        {link.prefix && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {link.prefix}
                          </span>
                        )}
                        <Input
                          id={`${link.id}-input`}
                          value={link.inputType === "username" ? link.details.username || "" : link.details.url || ""}
                          onChange={(e) => 
                            updateSocialLinkDetails(link.id, {
                              [link.inputType === "username" ? "username" : "url"]: e.target.value,
                            })
                          }
                          placeholder={link.placeholder}
                          className={link.prefix ? "pl-8" : ""}
                        />
                      </div>
                    </div>
                  )}
                  {link.inputType === "location" && (
                    <div className="space-y-2">
                      <Label htmlFor={`${link.id}-location`}>Location</Label>
                      <Input
                        id={`${link.id}-location`}
                        value={link.details.location || ""}
                        onChange={(e) => updateSocialLinkDetails(link.id, { location: e.target.value })}
                        placeholder={link.placeholder}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center gap-4">
          <Button
            variant="outline"
            className="w-32"
            onClick={navigateBack}
          >
            Back
          </Button>
          <Button
            variant="outline"
            className="w-32"
            onClick={() => navigate("/store-optimization")}
          >
            Skip
          </Button>
          <Button
            onClick={saveSocialLinks}
            disabled={isLoading}
            className="w-32 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
          >
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SocialLinks;
