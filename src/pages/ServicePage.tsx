import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';

const ServicePage = () => {
  const { userId } = useParams();
  const [businessName, setBusinessName] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_name, profile_image_url')
          .eq('id', userId)
          .single();

        if (profile) {
          setBusinessName(profile.company_name || "My Business");
          setProfileImage(profile.profile_image_url || "");
        }
      }
    };

    fetchBusinessDetails();
  }, [userId]);

  return (
    <>
      <Helmet>
        <title>{`${businessName} - Services`}</title>
        <meta property="og:title" content={`${businessName} - Services`} />
        <meta property="og:description" content={`Check out our services at ${businessName}`} />
        {profileImage && (
          <>
            <meta property="og:image" content={profileImage.startsWith('http') ? profileImage : `${window.location.origin}${profileImage}`} />
            <meta name="twitter:image" content={profileImage.startsWith('http') ? profileImage : `${window.location.origin}${profileImage}`} />
          </>
        )}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${businessName} - Services`} />
        <meta name="twitter:description" content={`Check out our services at ${businessName}`} />
      </Helmet>

      
    </>
  );
};

export default ServicePage;
