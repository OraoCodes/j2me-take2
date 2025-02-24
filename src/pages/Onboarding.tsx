
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SERVICE_TYPES = [
  "Beauty & Wellness",
  "Home Services",
  "Professional Services",
  "Health & Fitness",
  "Education & Tutoring",
  "Tech Services",
  "Other"
];

const REQUEST_RANGES = [
  "1-10",
  "11-50",
  "51-100",
  "100+"
];

const Onboarding = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const businessName = formData.get("businessName") as string;
    const serviceType = formData.get("serviceType") as string;
    const requestsPerMonth = formData.get("requestsPerMonth") as string;

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

    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: businessName,
        service_type: serviceType,
        service_requests_per_month: requestsPerMonth,
      })
      .eq("id", user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your business details. Please try again.",
      });
    } else {
      toast({
        title: "Success",
        description: "Your business details have been saved!",
      });
      navigate("/dashboard");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <img 
        src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" 
        alt="Gebeya" 
        className="h-12 mb-8 animate-fade-up" 
      />
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg animate-fade-up [animation-delay:200ms]">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Enter your service details
          </h2>
          <p className="text-muted-foreground">
            Provide information about your service business
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label htmlFor="requestsPerMonth">Monthly Service Requests</Label>
            <Select name="requestsPerMonth" required>
              <SelectTrigger>
                <SelectValue placeholder="Select request range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Request Ranges</SelectLabel>
                  {REQUEST_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range} requests per month
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
      </div>
    </div>
  );
};

export default Onboarding;
