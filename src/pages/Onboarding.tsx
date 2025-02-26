import { useState, useEffect } from "react";
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

const PROFESSIONS = [
  "Hairdresser / Hairstylist",
  "Nail Technician",
  "Makeup Artist",
  "Personal Trainer",
  "Massage Therapist",
  "Photographer",
  "Graphic Designer",
  "Social Media Manager",
  "Barber",
  "Videographer",
  "Coach",
  "Other"
] as const;

const SERVICE_TYPES = [
  "Beauty & Wellness",
  "Home Services",
  "Professional Services",
  "Health & Fitness",
  "Education & Tutoring",
  "Tech Services",
  "Other"
] as const;

const PROFESSION_TO_SERVICE_TYPE: Record<string, typeof SERVICE_TYPES[number]> = {
  "Hairdresser / Hairstylist": "Beauty & Wellness",
  "Nail Technician": "Beauty & Wellness",
  "Makeup Artist": "Beauty & Wellness",
  "Personal Trainer": "Health & Fitness",
  "Massage Therapist": "Health & Fitness",
  "Photographer": "Professional Services",
  "Graphic Designer": "Professional Services",
  "Social Media Manager": "Professional Services",
  "Barber": "Beauty & Wellness",
  "Videographer": "Professional Services",
  "Coach": "Education & Tutoring",
};

const REFERRAL_SOURCES = [
  "Search Engine",
  "Social Media",
  "Friend/Family",
  "Business Partner",
  "Advertisement",
  "Other"
] as const;

const PHONE_PREFIXES = [
  { value: "+254", label: "🇰🇪 +254" },
  { value: "+256", label: "🇺🇬 +256" },
  { value: "+255", label: "🇹🇿 +255" },
  { value: "+251", label: "🇪🇹 +251" },
  { value: "+250", label: "🇷🇼 +250" },
] as const;

type Step = 'businessDetails' | 'settings' | 'serviceCreated' | 'addServices';

const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('businessDetails');
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
  const [businessDetails, setBusinessDetails] = useState({
    profession: '',
    serviceType: '',
    referralSource: '',
  });
  const [settingsDetails, setSettingsDetails] = useState({
    whatsappNumber: '',
    customLink: '',
    phonePrefix: "+254",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedProfession && selectedProfession !== "Other") {
      const mappedServiceType = PROFESSION_TO_SERVICE_TYPE[selectedProfession];
      setSelectedServiceType(mappedServiceType);
    }
  }, [selectedProfession]);

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
          company_name: profession,
          service_type: serviceType,
          referral_source: referralSource,
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

  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const whatsappNumber = formData.get("whatsappNumber") as string;
    const customLink = formData.get("customLink") as string;
    const phonePrefix = formData.get("phonePrefix") as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const cleanCustomLink = customLink.trim() || null;
      const fullWhatsappNumber = `${phonePrefix}${whatsappNumber.replace(/^0+/, '')}`;

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
          whatsapp_number: fullWhatsappNumber,
          service_page_link: cleanCustomLink,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSettingsDetails({ whatsappNumber, customLink, phonePrefix });
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
            Tell us about yourself
          </DialogTitle>
          <DialogDescription>
            Select your profession and service details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleBusinessDetailsSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profession">What's your profession?</Label>
            <Select 
              name="profession" 
              required 
              onValueChange={(value) => setSelectedProfession(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your profession" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Professions</SelectLabel>
                  {PROFESSIONS.map((profession) => (
                    <SelectItem key={profession} value={profession}>
                      {profession}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedProfession === "Other" && (
              <div className="mt-2">
                <Input
                  id="customProfession"
                  name="customProfession"
                  placeholder="Enter your profession"
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Type of Service</Label>
            <Select 
              name="serviceType" 
              required
              value={selectedServiceType || undefined}
              onValueChange={setSelectedServiceType}
              disabled={selectedProfession !== "Other" && selectedProfession !== null}
            >
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
            <div className="flex gap-2">
              <Select 
                name="phonePrefix" 
                defaultValue="+254"
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select prefix" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Phone Prefixes</SelectLabel>
                    {PHONE_PREFIXES.map((prefix) => (
                      <SelectItem key={prefix.value} value={prefix.value}>
                        {prefix.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                type="tel"
                placeholder="712345678"
                className="flex-1"
              />
            </div>
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
