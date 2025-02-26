
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/Header";

const SERVICE_TYPES = [
  "Beauty & Wellness",
  "Home Services",
  "Professional Services",
  "Health & Fitness",
  "Education & Tutoring",
  "Tech Services",
  "Other"
] as const;

const REFERRAL_SOURCES = [
  "Search Engine",
  "Social Media",
  "Friend/Family",
  "Business Partner",
  "Advertisement",
  "Other"
] as const;

type Step = 'businessDetails' | 'settings' | 'serviceCreated' | 'addServices';

const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('businessDetails');
  const [businessDetails, setBusinessDetails] = useState({
    businessName: '',
    serviceType: '',
    referralSource: '',
  });
  const [settingsDetails, setSettingsDetails] = useState({
    whatsappNumber: '',
    customLink: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBusinessDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const businessName = formData.get("businessName") as string;
    const serviceType = formData.get("serviceType") as string;
    const referralSource = formData.get("referralSource") as string;

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
          company_name: businessName,
          service_type: serviceType,
          referral_source: referralSource,
        })
        .eq('id', user.id);

      if (error) throw error;

      setBusinessDetails({ businessName, serviceType, referralSource });
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

  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const whatsappNumber = formData.get("whatsappNumber") as string;
    const customLink = formData.get("customLink") as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const cleanCustomLink = customLink.trim() || null;

      if (cleanCustomLink) {
        const { data: existingProfile, error: searchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('service_page_link', cleanCustomLink)
          .neq('id', user.id)
          .maybeSingle();

        if (searchError) throw searchError;

        if (existingProfile) {
          toast({
            title: "Error",
            description: "This custom link is already taken. Please choose another one.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          whatsapp_number: whatsappNumber.trim() || null,
          service_page_link: cleanCustomLink,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSettingsDetails({ whatsappNumber, customLink });
      setCurrentStep('serviceCreated');
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update your settings. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const renderBusinessDetailsDialog = () => (
    <Dialog open={currentStep === 'businessDetails'} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Enter your service details
          </DialogTitle>
          <DialogDescription>
            Provide information about your service business
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBusinessDetailsSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              name="businessName"
              required
              placeholder="Enter your business name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Type of Service</Label>
            <Select name="serviceType" required>
              <SelectTrigger>
                <SelectValue placeholder="Select your service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Service Categories</SelectLabel>
                  {SERVICE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralSource">How did you hear about us?</Label>
            <Select name="referralSource" required>
              <SelectTrigger>
                <SelectValue placeholder="Select how you found us" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Referral Sources</SelectLabel>
                  {REFERRAL_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderSettingsDialog = () => (
    <Dialog open={currentStep === 'settings'} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Customize Your Service Page
          </DialogTitle>
          <DialogDescription>
            Set up your communication preferences and custom link
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              placeholder="Enter your WhatsApp number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customLink">Custom Service Page Link</Label>
            <Input
              id="customLink"
              name="customLink"
              type="text"
              placeholder="Enter your custom link (optional)"
            />
            <p className="text-sm text-gray-500">
              This will be your public service page URL
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderServiceCreatedDialog = () => (
    <Dialog open={currentStep === 'serviceCreated'} onOpenChange={() => {}}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold mb-4 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            🎉 Your Service Page is Live!
          </DialogTitle>
          <DialogDescription className="text-xl">
            Your service page has been created successfully
          </DialogDescription>
        </DialogHeader>

        <Button 
          onClick={() => setCurrentStep('addServices')}
          className="w-full h-14 text-lg text-white bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
        >
          Start customizing your page
        </Button>
      </DialogContent>
    </Dialog>
  );

  const renderAddServicesDialog = () => (
    <Dialog open={currentStep === 'addServices'} onOpenChange={() => {}}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold mb-4 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Add Your Services
          </DialogTitle>
          <DialogDescription className="text-xl">
            Start adding the services you offer
          </DialogDescription>
        </DialogHeader>

        <Button 
          onClick={() => navigate('/add-services')}
          className="w-full h-14 text-lg text-white bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
        >
          Add Services
        </Button>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <img 
          src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" 
          alt="Gebeya" 
          className="h-12 mb-8" 
        />
        {renderBusinessDetailsDialog()}
        {renderSettingsDialog()}
        {renderServiceCreatedDialog()}
        {renderAddServicesDialog()}
      </div>
    </div>
  );
};

export default Onboarding;
