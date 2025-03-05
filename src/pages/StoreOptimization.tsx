
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  dayOfWeek: number;
  dayName: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
}

const StoreOptimization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { dayOfWeek: 0, dayName: "Sunday", isAvailable: false, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 1, dayName: "Monday", isAvailable: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 2, dayName: "Tuesday", isAvailable: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 3, dayName: "Wednesday", isAvailable: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 4, dayName: "Thursday", isAvailable: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 5, dayName: "Friday", isAvailable: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 6, dayName: "Saturday", isAvailable: false, startTime: "09:00", endTime: "17:00" },
  ]);

  const handleTimeChange = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setTimeSlots(slots =>
      slots.map(slot =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, [field]: value } : slot
      )
    );
  };

  const toggleAvailability = (dayOfWeek: number) => {
    setTimeSlots(slots =>
      slots.map(slot =>
        slot.dayOfWeek === dayOfWeek ? { ...slot, isAvailable: !slot.isAvailable } : slot
      )
    );
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const availabilitySettings = timeSlots.map(slot => ({
        user_id: user.id,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: slot.isAvailable
      }));

      const { error } = await supabase
        .from('availability_settings')
        .upsert(availabilitySettings, { onConflict: 'user_id,day_of_week' });

      if (error) throw error;

      navigate("/pricing");
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save availability settings. Please try again.",
      });
    }
  };

  const navigateBack = () => {
    navigate('/social-links');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${step === 4
                    ? "border-gebeya-pink bg-white text-gebeya-pink"
                    : step < 4
                    ? "border-gebeya-pink bg-gebeya-pink text-white"
                    : "border-gray-200 text-gray-400"
                  }`}
              >
                {step < 4 ? (
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Set Your Availability
          </h1>
          <p className="text-gray-600 text-lg">
            Define when you're available to provide your services
          </p>
        </div>

        {/* Availability Settings */}
        <div className="space-y-4">
          {timeSlots.map((slot) => (
            <div
              key={slot.dayOfWeek}
              className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Clock className="w-6 h-6 text-gebeya-pink" />
                    <span className="font-medium">{slot.dayName}</span>
                  </div>
                  {slot.isAvailable && (
                    <div className="flex items-center gap-2 ml-9 mt-3">
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleTimeChange(slot.dayOfWeek, 'startTime', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleTimeChange(slot.dayOfWeek, 'endTime', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
                <Switch
                  checked={slot.isAvailable}
                  onCheckedChange={() => toggleAvailability(slot.dayOfWeek)}
                  className="data-[state=checked]:bg-gebeya-pink"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-12 flex justify-center gap-4">
          <Button
            variant="outline"
            className="w-32"
            onClick={navigateBack}
          >
            Back
          </Button>
          <Button
            variant="outline"
            className="w-32"
            onClick={() => navigate("/pricing")}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-32 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 text-white font-medium"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreOptimization;
