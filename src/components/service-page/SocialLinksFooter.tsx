
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Facebook, Instagram, Link2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialLink {
  platform_id: string;
  username: string | null;
  url: string | null;
  location: string | null;
  title: string | null;
  enabled: boolean;
}

interface SocialLinksFooterProps {
  userId: string;
}

export const SocialLinksFooter: React.FC<SocialLinksFooterProps> = ({ userId }) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFreeTier, setIsFreeTier] = useState(true);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('social_links')
          .select('*')
          .eq('user_id', userId)
          .eq('enabled', true);

        if (error) {
          throw error;
        }

        setSocialLinks(data || []);
      } catch (error) {
        console.error('Error fetching social links:', error);
        setError('Failed to load social links');
      } finally {
        setLoading(false);
      }
    };

    const fetchSubscriptionStatus = async () => {
      try {
        // Check if the user has a premium subscription
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          console.error('Error fetching subscription status:', error);
        } else {
          // If there's an active subscription, they're not on free tier
          setIsFreeTier(!data);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };

    if (userId) {
      fetchSocialLinks();
      fetchSubscriptionStatus();
    }
  }, [userId]);

  if (loading) return null;
  if (error && socialLinks.length === 0) return null;

  const renderIcon = (platformId: string) => {
    switch (platformId) {
      case 'facebook':
        return <Facebook className="h-5 w-5 text-[#1877F2]" />;
      case 'instagram':
        return <Instagram className="h-5 w-5 text-[#E4405F]" />;
      case 'link':
        return <Link2 className="h-5 w-5 text-gray-700" />;
      case 'googlemap':
        return <MapPin className="h-5 w-5 text-[#EA4335]" />;
      case 'whatsapp':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        );
      case 'telegram':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#229ED9">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.65.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.24-.02.27z" />
          </svg>
        );
      case 'tiktok':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="black">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FF0000">
            <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.9 3.6 12 3.6 12 3.6s-7.9 0-9.5.5c-1 .3-1.7 1.1-2 2.1 1.6.5 9.5.5 9.5.5s7.9 0 9.5-.5c1-.3 1.7-1.1 2-2.1.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8z" />
            <path fill="#FFF" d="M9.6 15.6V8.4l6.4 3.6z" />
          </svg>
        );
      default:
        return <Link2 className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLink = (link: SocialLink) => {
    switch (link.platform_id) {
      case 'instagram':
        return `https://instagram.com/${link.username}`;
      case 'tiktok':
        return `https://tiktok.com/@${link.username}`;
      case 'youtube':
        return `https://youtube.com/@${link.username}`;
      case 'facebook':
      case 'whatsapp':
      case 'telegram':
      case 'link':
        return link.url;
      case 'googlemap':
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(link.location || '')}`;
      default:
        return '#';
    }
  };

  const getLinkTitle = (link: SocialLink) => {
    switch (link.platform_id) {
      case 'instagram':
        return `@${link.username}`;
      case 'tiktok':
        return `@${link.username}`;
      case 'youtube':
        return `YouTube`;
      case 'facebook':
        return 'Facebook';
      case 'whatsapp':
        return 'WhatsApp';
      case 'telegram':
        return 'Telegram';
      case 'googlemap':
        return link.location || 'View on Map';
      case 'link':
        return link.title || 'Website';
      default:
        return link.title || 'Link';
    }
  };

  return (
    <div className="py-8 mt-8 border-t border-gray-200">
      {socialLinks.length > 0 && (
        <>
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Connect With Us</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.platform_id}
                href={getLink(link)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {renderIcon(link.platform_id)}
                <span className="text-sm font-medium">{getLinkTitle(link)}</span>
              </a>
            ))}
          </div>
        </>
      )}

      {isFreeTier && (
        <div className="mt-8 text-center">
          <div className="mb-3">
            <h3 className="text-lg font-medium">Want a professional service page like this?</h3>
            <p className="text-sm text-gray-600 mt-1">Create your own business service page in minutes</p>
          </div>
          <Button 
            onClick={() => window.open('https://jitume.gebeya.com', '_blank')}
            className="bg-gebeya-pink hover:bg-gebeya-pink/90 text-white px-6"
          >
            Create your own page
          </Button>
        </div>
      )}
    </div>
  );
};
