import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    user_id: string;
  };
  initialData?: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    scheduled_at: Date;
  };
  isEditing?: boolean;
  requestId?: string;
}

export const ServiceCheckoutDialog = ({
  isOpen,
  onClose,
  service,
  initialData,
  isEditing = false,
  requestId,
}: ServiceCheckoutDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(initialData?.scheduled_at || undefined);
  const [hour, setHour] = useState<string>(initialData?.scheduled_at ? format(initialData.scheduled_at, 'hh') : "");
  const [minute, setMinute] = useState<string>(initialData?.scheduled_at ? format(initialData.scheduled_at, 'mm') : "");
  const [period, setPeriod] = useState<string>(initialData?.scheduled_at ? format(initialData.scheduled_at, 'a').toUpperCase() : "AM");
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    notes: initialData?.notes || "",
  });

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!date || !hour || !minute) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both date and time for your service request.",
      });
      setLoading(false);
      return;
    }

    try {
      // Convert 12-hour format to 24-hour format
      let hourIn24 = parseInt(hour);
      if (period === "PM" && hourIn24 !== 12) hourIn24 += 12;
      if (period === "AM" && hourIn24 === 12) hourIn24 = 0;

      const scheduledAt = new Date(date);
      scheduledAt.setHours(hourIn24, parseInt(minute));

      const requestData = {
        service_id: service.id,
        user_id: service.user_id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        notes: formData.notes,
        scheduled_at: scheduledAt.toISOString()
      };

      let error;
      if (isEditing && requestId) {
        // Update existing request
        const { error: updateError } = await supabase
          .from("service_requests")
          .update(requestData)
          .eq('id', requestId);
        error = updateError;
      } else {
        // Create new request
        const { error: insertError } = await supabase
          .from("service_requests")
          .insert({ ...requestData, status: 'pending' });
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success!",
        description: isEditing ? "Service request updated successfully." : "Your service request has been submitted.",
      });

      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditing ? "Failed to update service request." : "Failed to submit service request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeDisplay = () => {
    if (!hour || !minute) return "Select time";
    return `${hour}:${minute} ${period}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service Request" : "Request Service"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the service request details." : "Fill in your details to request this service."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className="font-medium">{service.name}</h3>
              <p className="text-lg font-semibold text-gebeya-pink">
                KES {service.price.toLocaleString()}
              </p>
            </div>
            {service.description && (
              <p className="text-sm text-gray-500">{service.description}</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                required
                className="mt-1"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label>Preferred Date *</Label>
                <div className="mt-1">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>
              </div>

              <div>
                <Label>Preferred Time *</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Select
                    value={hour}
                    onValueChange={(value) => {
                      console.log("Hour selected:", value);
                      setHour(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={minute}
                    onValueChange={(value) => {
                      console.log("Minute selected:", value);
                      setMinute(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={period}
                    onValueChange={(value) => {
                      console.log("Period selected:", value);
                      setPeriod(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="mt-1"
                placeholder="Any specific requirements or questions..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
