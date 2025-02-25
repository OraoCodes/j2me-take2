
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
  const [customLink, setCustomLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        .select('company_name, whatsapp_number, service_page_link')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setCompanyName(profile.company_name || "");
        setWhatsappNumber(profile.whatsapp_number || "");
        setCustomLink(profile.service_page_link || "");
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
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // First check if the custom link is already taken by another user
      if (customLink) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('service_page_link', customLink)
          .neq('id', user.id)
          .single();

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

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: companyName,
          whatsapp_number: whatsappNumber,
          service_page_link: customLink,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Your service page settings have been updated.",
      });

      navigate('/service-share');
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
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <Input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter your business name"
                  required
                />
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
                />
              </div>
            </div>
          </FormSection>

          <FormSection number="2" title="Customize Your Link">
            <div>
              <label htmlFor="customLink" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Service Page Link
              </label>
              <Input
                id="customLink"
                type="text"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                placeholder="Enter your custom link (optional)"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be your public service page URL
              </p>
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
