
import { useRef, useState, FormEvent } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, Wand2 } from "lucide-react";
import { ProfileImageCropper } from "./ProfileImageCropper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PHONE_PREFIXES = [
  { value: "+254", label: "🇰🇪 +254" },
  { value: "+256", label: "🇺🇬 +256" },
  { value: "+255", label: "🇹🇿 +255" },
  { value: "+251", label: "🇪🇹 +251" },
  { value: "+250", label: "🇷🇼 +250" },
] as const;

interface SettingsDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  businessName: string;
  profileImage: string | null;
  isGeneratingName: boolean;
  onSubmit: (phonePrefix: string, phoneNumber: string | null, businessName: string) => Promise<void>;
  onBusinessNameChange: (value: string) => void;
  onGenerateBusinessName: () => Promise<void>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsDialog = ({
  isOpen,
  isLoading,
  businessName,
  profileImage,
  isGeneratingName,
  onSubmit,
  onBusinessNameChange,
  onGenerateBusinessName,
  onImageUpload,
}: SettingsDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [selectedPrefix, setSelectedPrefix] = useState("+254");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageUrl(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(selectedPrefix, phoneNumber || null, businessName);
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    fetch(croppedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
        const event = {
          target: {
            files: [file]
          }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onImageUpload(event);
      });
    setShowCropper(false);
    setTempImageUrl(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Customize Your Service Page
          </DialogTitle>
          <DialogDescription>
            Set up your profile and communication preferences
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24 border-2 border-gebeya-pink">
                {profileImage ? (
                  <AvatarImage 
                    src={profileImage} 
                    alt="Profile" 
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white">
                    <Upload className="w-8 h-8" />
                  </AvatarFallback>
                )}
              </Avatar>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Profile Picture
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <div className="flex gap-2">
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => onBusinessNameChange(e.target.value)}
                  placeholder="Enter your business name"
                />
                <TooltipProvider>
                  <Tooltip defaultOpen>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onGenerateBusinessName}
                        disabled={isGeneratingName}
                      >
                        {isGeneratingName ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-white p-3 shadow-lg rounded-lg border max-w-[200px] text-center">
                      <p>Click to generate a creative business name using AI!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <div className="flex gap-2">
                <Select 
                  value={selectedPrefix}
                  onValueChange={setSelectedPrefix}
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
                  type="tel"
                  placeholder="712345678"
                  className="flex-1"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </form>

        {showCropper && tempImageUrl && (
          <ProfileImageCropper
            open={showCropper}
            onClose={() => {
              setShowCropper(false);
              setTempImageUrl(null);
            }}
            imageUrl={tempImageUrl}
            onCropComplete={handleCropComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
