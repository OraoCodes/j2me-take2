import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface BusinessDetailsDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export const BusinessDetailsDialog = ({ isOpen, isLoading, onSubmit }: BusinessDetailsDialogProps) => {
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);
  const [referralSource, setReferralSource] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset any previous errors
    setFormError(null);
    
    // Check if all fields are filled
    const form = e.currentTarget;
    const firstName = form.querySelector('#firstName') as HTMLInputElement;
    const lastName = form.querySelector('#lastName') as HTMLInputElement;
    
    // Debug logs to help identify the issue
    console.log("Form submission values:", {
      firstName: firstName.value,
      lastName: lastName.value,
      profession: selectedProfession,
      serviceType: selectedServiceType,
      referralSource: referralSource
    });
    
    if (!firstName.value || !lastName.value || !selectedProfession || !selectedServiceType || !referralSource) {
      setFormError("Please fill out all fields");
      return;
    }
    
    // If "Other" is selected and customProfession is provided, 
    // use it as the profession
    if (selectedProfession === "Other") {
      const customProfessionInput = form.querySelector('#customProfession') as HTMLInputElement;
      
      if (!customProfessionInput || !customProfessionInput.value.trim()) {
        setFormError("Please enter your profession");
        return;
      }
    }
    
    // Add the service type to the form data before submitting
    const hiddenServiceTypeInput = document.createElement('input');
    hiddenServiceTypeInput.type = 'hidden';
    hiddenServiceTypeInput.name = 'serviceType';
    hiddenServiceTypeInput.value = selectedServiceType || '';
    form.appendChild(hiddenServiceTypeInput);
    
    await onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Tell us about yourself
          </DialogTitle>
          <DialogDescription>
            Let's get to know you better
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name*</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name*</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profession">What's your profession?*</Label>
            <Select 
              name="profession" 
              required 
              onValueChange={(value) => {
                setSelectedProfession(value);
                if (value !== "Other") {
                  const serviceType = PROFESSION_TO_SERVICE_TYPE[value];
                  setSelectedServiceType(serviceType);
                } else {
                  setSelectedServiceType(null);
                }
              }}
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
            <Label htmlFor="serviceType">Type of Service*</Label>
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
            <Label htmlFor="referralSource">How did you hear about us?*</Label>
            <Select 
              name="referralSource" 
              required
              onValueChange={setReferralSource}
            >
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

          {formError && (
            <div className="text-sm font-medium text-red-500 dark:text-red-400">
              {formError}
            </div>
          )}

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
};
