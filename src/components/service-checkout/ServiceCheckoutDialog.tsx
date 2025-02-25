import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, set } from "date-fns";
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

interface AvailabilitySetting {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BlockedDate {
  blocked_date: string;
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
  const [hour, setHour] = useState<string>("");
  const [minute, setMinute] = useState<string>("");
  const [period, setPeriod] = useState<string>("AM");
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    notes: initialData?.notes || "",
  });

  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  useEffect(() => {
    if (initialData?.scheduled_at) {
      const scheduledDate = new Date(initialData.scheduled_at);
      setDate(scheduledDate);
      let hours = scheduledDate.getHours();
      const minutes = scheduledDate.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      
      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }
      
      setHour(hours.toString().padStart(2, '0'));
      setMinute(minutes.toString().padStart(2, '0'));
      setPeriod(period);
    }
  }, [initialData]);

  useEffect(() => {
    fetchAvailabilitySettings();
  }, [service.user_id]);

  const fetchAvailabilitySettings = async () => {
    try {
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', service.user_id);

      if (availabilityError) throw availabilityError;
      
      if (availabilityData) {
        setAvailabilitySettings(availabilityData);
      }

      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_dates')
        .select('blocked_date')
        .eq('user_id', service.user_id);

      if (blockedError) throw blockedError;
      
      if (blockedData) {
        setBlockedDates(blockedData);
      }
    } catch (error) {
      console.error('Error fetching availability settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load availability settings. Please try again.",
      });
    }
  };

  const isDateAvailable = (date: Date) => {
    const isBlocked = blockedDates.some(
      blocked => format(new Date(blocked.blocked_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    if (isBlocked) return false;

    const dayOfWeek = date.getDay();
    const daySetting = availabilitySettings.find(s => s.day_of_week === dayOfWeek);
    return daySetting?.is_available ?? false;
  };

  const generateTimeSlots = (startTime: string, endTime: string) => {
    const slots: { hour: string; minute: string; period: string }[] = [];
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());

    let current = start;
    while (current <= end) {
      let hours = current.getHours();
      const minutes = current.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';

      if (hours > 12) {
        hours -= 12;
      } else if (hours === 0) {
        hours = 12;
      }

      slots.push({
        hour: hours.toString().padStart(2, '0'),
        minute: minutes.toString().padStart(2, '0'),
        period
      });

      current = new Date(current.getTime() + 15 * 60000);
    }

    return slots;
  };

  const getAvailableTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const daySetting = availabilitySettings.find(s => s.day_of_week === dayOfWeek);
    
    if (!daySetting?.is_available) return [];
    
    return generateTimeSlots(daySetting.start_time, daySetting.end_time);
  };

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
      let hourIn24 = parseInt(hour);
      if (period === "PM" && hourIn24 !== 12) {
        hourIn24 += 12;
      } else if (period === "AM" && hourIn24 === 12) {
        hourIn24 = 0;
      }

      const scheduledAt = set(date, {
        hours: hourIn24,
        minutes: parseInt(minute),
        seconds: 0,
        milliseconds: 0
      });

      const requestData = {
        service_id: service.id,
        user_id: service.user_id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        notes: formData.notes,
        scheduled_at: scheduledAt.toISOString(),
      };

      let error;
      if (isEditing && requestId) {
        const { error: updateError } = await supabase
          .from("service_requests")
          .update(requestData)
          .eq('id', requestId);
        error = updateError;
      } else {
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
      console.error('Error submitting service request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditing ? "Failed to update service request." : "Failed to submit service request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableTimeSlots = date ? getAvailableTimeSlots(date) : [];
  const uniqueHours = Array.from(new Set(availableTimeSlots.map(slot => slot.hour)));
  const availableMinutes = availableTimeSlots
    .filter(slot => slot.hour === hour && slot.period === period)
    .map(slot => slot.minute);
  const availablePeriods = Array.from(new Set(availableTimeSlots
    .filter(slot => slot.hour === hour)
    .map(slot => slot.period)));

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
                    onSelect={(newDate) => {
                      setDate(newDate);
                      setHour("");
                      setMinute("");
                      setPeriod("AM");
                    }}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || !isDateAvailable(date);
                    }}
                    className="rounded-md border"
                  />
                </div>
              </div>

              {date && (
                <div>
                  <Label>Preferred Time *</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <Select value={hour} onValueChange={(value) => {
                      setHour(value);
                      setMinute("");
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueHours.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={minute} 
                      onValueChange={setMinute}
                      disabled={!hour}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMinutes.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={period} 
                      onValueChange={(value) => {
                        setPeriod(value);
                        setMinute("");
                      }}
                      disabled={!hour}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="AM/PM" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePeriods.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

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
