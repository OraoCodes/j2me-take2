import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parse, set, addMinutes } from "date-fns";
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
    instant_booking: boolean;
    serviceMode?: string;
    travelFee?: string;
  };
  initialData?: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    scheduled_at: Date;
    location?: string;
  };
  isEditing?: boolean;
  requestId?: string;
  onSubmitSuccess?: () => void;
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

interface BookedSlot {
  scheduled_at: string;
}

export const ServiceCheckoutDialog = ({
  isOpen,
  onClose,
  service,
  initialData,
  isEditing = false,
  requestId,
  onSubmitSuccess,
}: ServiceCheckoutDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(initialData?.scheduled_at || undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    countryCode: "+254", // Default to Kenya
    notes: initialData?.notes || "",
    location: initialData?.location || "",
  });

  const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  const calculateTotalPrice = () => {
    let total = service.price;
    if (service.serviceMode === 'client-location' && service.travelFee) {
      total += parseFloat(service.travelFee);
    }
    return total;
  };

  useEffect(() => {
    if (initialData?.scheduled_at) {
      const scheduledDate = new Date(initialData.scheduled_at);
      setDate(scheduledDate);
      setSelectedTime(format(scheduledDate, 'HH:mm'));
    }
  }, [initialData]);

  useEffect(() => {
    fetchAvailabilitySettings();
  }, [service.user_id]);

  useEffect(() => {
    if (date) {
      fetchBookedSlots(date);
    }
  }, [date]);

  const fetchAvailabilitySettings = async () => {
    setIsLoadingSettings(true);
    try {
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', service.user_id);

      if (availabilityError) throw availabilityError;

      const { data: blockedData, error: blockedError } = await supabase
        .from('blocked_dates')
        .select('blocked_date')
        .eq('user_id', service.user_id);

      if (blockedError) throw blockedError;

      setAvailabilitySettings(availabilityData || []);
      setBlockedDates(blockedData || []);
      
      console.log('Fetched settings:', {
        availabilityData,
        blockedData
      });
      
    } catch (error) {
      console.error('Error fetching availability settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load availability settings. Please try again.",
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const fetchBookedSlots = async (selectedDate: Date) => {
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('service_requests')
        .select('scheduled_at')
        .eq('user_id', service.user_id)
        .in('status', ['accepted', 'completed'])
        .gte('scheduled_at', startOfDay.toISOString())
        .lte('scheduled_at', endOfDay.toISOString());

      if (error) throw error;

      setBookedSlots(data || []);
      console.log('Booked slots:', data);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load booked slots. Please try again.",
      });
    }
  };

  const isDateAvailable = (date: Date) => {
    if (!date || isLoadingSettings) return false;

    const isBlocked = blockedDates.some(
      blocked => format(new Date(blocked.blocked_date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (isBlocked) return false;

    const dayOfWeek = date.getDay();
    const daySetting = availabilitySettings.find(s => s.day_of_week === dayOfWeek);
    
    return Boolean(daySetting?.is_available);
  };

  const isTimeSlotAvailable = (timeSlot: string) => {
    if (!date) return false;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return !bookedSlots.some(bookedSlot => {
      const bookedDateTime = new Date(bookedSlot.scheduled_at);
      return (
        bookedDateTime.getHours() === hours &&
        bookedDateTime.getMinutes() === minutes
      );
    });
  };

  const getAvailableTimeSlots = (date: Date) => {
    if (!date || isLoadingSettings) return [];

    const dayOfWeek = date.getDay();
    const daySetting = availabilitySettings.find(s => s.day_of_week === dayOfWeek);

    if (!daySetting?.is_available || !daySetting.start_time || !daySetting.end_time) {
      return [];
    }

    try {
      const slots: string[] = [];
      const baseDate = new Date(date);
      const [startHours, startMinutes] = daySetting.start_time.split(':').map(Number);
      const [endHours, endMinutes] = daySetting.end_time.split(':').map(Number);

      baseDate.setHours(startHours, startMinutes, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(endHours, endMinutes, 0, 0);

      let current = baseDate;
      while (current <= endTime) {
        const timeSlot = format(current, 'HH:mm');
        if (isTimeSlotAvailable(timeSlot)) {
          slots.push(timeSlot);
        }
        current = addMinutes(current, 60);
      }

      return slots;
    } catch (error) {
      console.error('Error generating time slots:', error);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!date || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both date and time for your service request.",
      });
      setLoading(false);
      return;
    }

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = set(date, {
        hours,
        minutes,
        seconds: 0,
        milliseconds: 0
      });

      const fullPhoneNumber = `${formData.countryCode}${formData.phone.startsWith("0") ? formData.phone.slice(1) : formData.phone}`;
      
      console.log('Submitting service request with data:', {
        service_id: service.id,
        user_id: service.user_id,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: fullPhoneNumber,
        notes: formData.notes,
        scheduled_at: scheduledAt.toISOString(),
        status: service.instant_booking === true ? 'accepted' : 'pending',
        location: service.serviceMode === 'client-location' ? formData.location : null,
      });

      let requestData;
      let error;
      
      if (isEditing && requestId) {
        const { data, error: updateError } = await supabase
          .from("service_requests")
          .update({
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: fullPhoneNumber,
            notes: formData.notes,
            scheduled_at: scheduledAt.toISOString(),
            location: service.serviceMode === 'client-location' ? formData.location : null,
          })
          .eq('id', requestId)
          .select();
          
        requestData = data?.[0];
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("service_requests")
          .insert({
            service_id: service.id,
            user_id: service.user_id,
            customer_name: formData.name,
            customer_email: formData.email,
            customer_phone: fullPhoneNumber,
            notes: formData.notes,
            scheduled_at: scheduledAt.toISOString(),
            status: service.instant_booking === true ? 'accepted' : 'pending',
            location: service.serviceMode === 'client-location' ? formData.location : null,
          })
          .select();
          
        requestData = data?.[0];
        error = insertError;
      }

      if (error) {
        console.error('Service request error:', error);
        throw error;
      }

      // Send a notification to n8n webhook
      try {
        const scheduledTime = format(scheduledAt, 'PPP p');
        const formattedPrice = service.price.toLocaleString();
        
        const webhookData = {
          serviceName: service.name,
          servicePrice: `KES ${formattedPrice}`,
          serviceStatus: service.instant_booking === true ? 'accepted' : 'pending',
          
          customerName: formData.name,
          customerPhone: fullPhoneNumber,
          customerEmail: formData.email || "Not provided",
          
          appointmentDate: scheduledTime,
          specialRequests: formData.notes || "None",
          
          location: service.serviceMode === 'client-location' ? formData.location : "Provider location",
          
          requestId: requestData?.id || "Unknown",
          timestamp: new Date().toISOString()
        };

        console.log('Sending n8n webhook notification with data:', webhookData);
        
        const response = await fetch('https://martinndlovu.app.n8n.cloud/webhook/16091124-b34e-4c6e-a8f3-7a5856532bac', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
        });

        if (!response.ok) {
          throw new Error(`Error sending n8n webhook: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('n8n webhook result:', result);
      } catch (notifyError) {
        console.error('Error sending n8n webhook notification:', notifyError);
        // Don't throw here - we don't want to fail the service request if notification fails
      }

      toast({
        title: "Success!",
        description: service.instant_booking === true
          ? "Your service request has been automatically accepted."
          : "Your service request has been submitted for approval.",
      });

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting service request:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: isEditing 
          ? "Failed to update service request. Please try again." 
          : "Failed to submit service request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimeSlot = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return format(date, 'h:mm a');
  };

  const availableTimeSlots = date ? getAvailableTimeSlots(date) : [];

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
              <div className="text-right">
                <p className="text-lg font-semibold text-gebeya-pink">
                  KES {calculateTotalPrice().toLocaleString()}
                </p>
                {service.serviceMode === 'client-location' && service.travelFee && (
                  <p className="text-sm text-gray-500">
                    (Includes travel fee: KES {parseFloat(service.travelFee).toLocaleString()})
                  </p>
                )}
              </div>
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
              <div className="flex gap-2 mt-1">
                <Select
                  value={formData.countryCode}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, countryCode: value }))
                  }
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+254">🇰🇪 +254</SelectItem>
                    <SelectItem value="+255">🇹🇿 +255</SelectItem>
                    <SelectItem value="+256">🇺🇬 +256</SelectItem>
                    <SelectItem value="+251">🇪🇹 +251</SelectItem>
                    <SelectItem value="+250">🇷🇼 +250</SelectItem>
                    <SelectItem value="+257">🇧🇮 +257</SelectItem>
                    <SelectItem value="+253">🇩🇯 +253</SelectItem>
                    <SelectItem value="+252">🇸🇴 +252</SelectItem>
                    <SelectItem value="+211">🇸🇸 +211</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="712345678"
                  className="flex-1"
                  required
                />
              </div>
            </div>

            {service.serviceMode === 'client-location' && (
              <div>
                <Label htmlFor="location">Service Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="Enter your address"
                  required
                  className="mt-1"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label>Preferred Date *</Label>
                <div className="mt-1">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today || !isDateAvailable(date);
                    }}
                    className="rounded-md border"
                  />
                </div>
              </div>

              {isLoadingSettings ? (
                <div className="text-center text-sm text-gray-500">
                  Loading available time slots...
                </div>
              ) : (
                <>
                  {date && availableTimeSlots.length > 0 && (
                    <div>
                      <Label>Available Time Slots *</Label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {availableTimeSlots.map((timeSlot) => (
                          <Button
                            key={timeSlot}
                            type="button"
                            variant={selectedTime === timeSlot ? "default" : "outline"}
                            className={`w-full ${
                              selectedTime === timeSlot 
                                ? "bg-gebeya-pink hover:bg-gebeya-pink/90" 
                                : "hover:border-gebeya-pink/50"
                            }`}
                            onClick={() => setSelectedTime(timeSlot)}
                          >
                            {formatTimeSlot(timeSlot)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {date && availableTimeSlots.length === 0 && (
                    <div className="text-center text-sm text-gray-500">
                      No available time slots for the selected date. Please select another date.
                    </div>
                  )}
                </>
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
