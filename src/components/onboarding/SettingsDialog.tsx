
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
import { Loader2, Upload, Wand2, Search } from "lucide-react";
import { ProfileImageCropper } from "./ProfileImageCropper";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PHONE_PREFIXES } from "@/constants/phone";

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
  const [selectedPrefix, setSelectedPrefix] = useState<string>("+254");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [businessNameError, setBusinessNameError] = useState("");

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
    
    // Validate business name
    if (!businessName || businessName.trim() === "") {
      setBusinessNameError("Business name is required");
      return;
    }
    
    setBusinessNameError("");
    await onSubmit(selectedPrefix, phoneNumber || null, businessName);
  };

  const handleBusinessNameChange = (value: string) => {
    onBusinessNameChange(value);
    if (value.trim() !== "") {
      setBusinessNameError("");
    }
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

  // Filter phone prefixes based on search query
  const filteredPrefixes = searchQuery 
    ? PHONE_PREFIXES.filter(prefix => 
        prefix.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prefix.value.includes(searchQuery)
      )
    : PHONE_PREFIXES;

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
              <Label htmlFor="businessName" className="flex">
                Business Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  placeholder="Enter your business name"
                  required
                  className={businessNameError ? "border-red-500" : ""}
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
              {businessNameError && (
                <p className="text-red-500 text-sm mt-1">{businessNameError}</p>
              )}
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
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    <div className="px-2 py-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search country code..."
                          className="pl-8"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <SelectGroup>
                      <SelectLabel>Phone Prefixes</SelectLabel>
                      {filteredPrefixes.map((prefix) => (
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
