
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { BusinessDetailsDialog } from "@/components/onboarding/BusinessDetailsDialog";
import { SettingsDialog } from "@/components/onboarding/SettingsDialog";
import { ServiceCreatedDialog } from "@/components/onboarding/ServiceCreatedDialog";
import { AddServicesDialog } from "@/components/onboarding/AddServicesDialog";
import { ProfileImageCropper } from "@/components/onboarding/ProfileImageCropper";
import { BackButton } from "@/components/onboarding/BackButton";

type Step = 'businessDetails' | 'settings' | 'serviceCreated' | 'addServices';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState<Step>('businessDetails');
  const [isLoading, setIsLoading] = useState(false);
  const [businessDetails, setBusinessDetails] = useState({
    profession: '',
    serviceType: '',
    referralSource: '',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [businessName, setBusinessName] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBusinessDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const selectedProf = formData.get("profession") as string;
    const customProf = formData.get("customProfession") as string;
    const serviceType = formData.get("serviceType") as string;
    const referralSource = formData.get("referralSource") as string;
    
    const profession = selectedProf === "Other" ? customProf : selectedProf;

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to complete onboarding.",
      });
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          profession: profession,
          service_type: serviceType,
          referral_source: referralSource,
          company_name: profession, // Also setting company_name to profession for compatibility
        })
        .eq('id', user.id);

      if (error) throw error;

      setBusinessDetails({ profession, serviceType, referralSource });
      setCurrentStep('settings');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your business details. Please try again.",
      });
    }
    
    setIsLoading(false);
  };

  const handleSettingsSubmit = async (phonePrefix: string, phoneNumber: string | null, businessName: string) => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Validate business name (double-check even though the component validation should prevent this)
      if (!businessName || businessName.trim() === "") {
        throw new Error('Business name is required');
      }

      const fullWhatsappNumber = phoneNumber ? 
        `${phonePrefix}${phoneNumber.replace(/^0+/, '')}` : 
        null;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          company_name: businessName.trim(),
          whatsapp_number: fullWhatsappNumber,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setCurrentStep('serviceCreated');
    } catch (error) {
      console.error('Settings update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempImageUrl(URL.createObjectURL(file));
      setShowCropDialog(true);
    }
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      setIsLoading(true);
      setShowCropDialog(false); // Close dialog immediately to prevent double cropping
      
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError, data } = await supabase.storage
        .from('profiles')
        .upload(fileName, blob, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfileImage(publicUrl);
      setTempImageUrl(null);
      
      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateBusinessName = async () => {
    setIsGeneratingName(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setBusinessName('');

      const { data, error } = await supabase.functions.invoke('generate-business-name', {
        body: {
          name: user.user_metadata?.full_name || '',
          profession: businessDetails.profession,
        },
      });

      if (error) throw error;

      setBusinessName(data.businessName);
    } catch (error) {
      console.error('Error generating business name:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate business name. Please try again.",
      });
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleBackStep = () => {
    if (currentStep === 'settings') {
      setCurrentStep('businessDetails');
    } else if (currentStep === 'serviceCreated') {
      setCurrentStep('settings');
    } else if (currentStep === 'addServices') {
      setCurrentStep('serviceCreated');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      {currentStep !== 'businessDetails' && (
        <BackButton className="md:fixed" onClick={handleBackStep} />
      )}
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <img 
          src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" 
          alt="Gebeya" 
          className="h-12 mb-8" 
        />
        
        <BusinessDetailsDialog
          isOpen={currentStep === 'businessDetails'}
          isLoading={isLoading}
          onSubmit={handleBusinessDetailsSubmit}
        />

        <SettingsDialog
          isOpen={currentStep === 'settings'}
          isLoading={isLoading}
          businessName={businessName}
          profileImage={profileImage}
          isGeneratingName={isGeneratingName}
          onSubmit={handleSettingsSubmit}
          onBusinessNameChange={setBusinessName}
          onGenerateBusinessName={generateBusinessName}
          onImageUpload={handleImageUpload}
        />

        <ServiceCreatedDialog
          isOpen={currentStep === 'serviceCreated'}
          onNext={() => setCurrentStep('addServices')}
        />

        <AddServicesDialog
          isOpen={currentStep === 'addServices'}
          onNavigateToServices={() => navigate('/add-services')}
        />

        <ProfileImageCropper
          open={showCropDialog}
          onClose={() => {
            setShowCropDialog(false);
            setTempImageUrl(null);
          }}
          imageUrl={tempImageUrl || ''}
          onCropComplete={handleCropComplete}
        />
      </div>
    </div>
  );
};

export default Onboarding;
