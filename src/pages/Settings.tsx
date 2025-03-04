
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { FormSection } from "@/components/service-form/FormSection";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companyNameError, setCompanyNameError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_name, whatsapp_number')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        setCompanyName(profile.company_name || "");
        setWhatsappNumber(profile.whatsapp_number || "");
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast({
        title: "Error",
        description: "Could not load your profile settings.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate business name
    if (!companyName || companyName.trim() === "") {
      setCompanyNameError("Business name is required");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const phonePrefix = formData.get("phonePrefix") as string;
      const phoneNumber = formData.get("whatsappNumber") as string;
      const fullWhatsappNumber = `${phonePrefix}${phoneNumber.replace(/^0+/, '')}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          company_name: companyName.trim(),
          whatsapp_number: fullWhatsappNumber || null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Your service page settings have been updated.",
      });

      navigate('/service-created');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error",
        description: "Could not update your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
          Create Your Service Page
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          <FormSection number="1" title="Business Information">
            <div className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1 flex">
                  Business Name <span className="text-red-500 ml-1">*</span>
                </label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    if (e.target.value.trim() !== "") {
                      setCompanyNameError("");
                    }
                  }}
                  placeholder="Enter your business name"
                  required
                  className={companyNameError ? "border-red-500" : ""}
                />
                {companyNameError && (
                  <p className="text-red-500 text-sm mt-1">{companyNameError}</p>
                )}
              </div>

              <div>
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Enter your WhatsApp number"
                  name="whatsappNumber"
                />
              </div>
            </div>
          </FormSection>

          <div className="flex gap-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save and Continue"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
