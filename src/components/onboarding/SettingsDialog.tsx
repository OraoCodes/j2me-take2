
import { useRef, useState } from "react";
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
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
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

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt="Profile" />
                ) : (
                  <AvatarFallback>
                    <Upload className="w-8 h-8 text-muted-foreground" />
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
                onChange={onImageUpload}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <div className="flex gap-2">
                <Input
                  id="businessName"
                  name="businessName"
                  value={businessName}
                  onChange={(e) => onBusinessNameChange(e.target.value)}
                  placeholder="Enter your business name"
                />
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <div className="flex gap-2">
                <Select name="phonePrefix" defaultValue="+254">
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
};
