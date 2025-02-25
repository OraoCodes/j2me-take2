
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface AvailabilitySetting {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilitySettings() {
  const { toast } = useToast();
  const [weeklySchedule, setWeeklySchedule] = useState<AvailabilitySetting[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailabilitySettings();
    fetchBlockedDates();
  }, []);

  const fetchAvailabilitySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('availability_settings')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week');

      if (error) throw error;

      if (!data || data.length === 0) {
        // Initialize default settings if none exist
        await initializeDefaultSettings(user.id);
        await fetchAvailabilitySettings(); // Fetch again after initialization
        return;
      }

      setWeeklySchedule(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching availability settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch availability settings",
      });
    }
  };

  const initializeDefaultSettings = async (userId: string) => {
    try {
      const defaultSettings = Array.from({ length: 7 }, (_, i) => ({
        user_id: userId,
        day_of_week: i,
        start_time: '09:00',
        end_time: '17:00',
        is_available: i !== 0 && i !== 6, // Default closed on weekends
      }));

      const { error } = await supabase
        .from('availability_settings')
        .insert(defaultSettings);

      if (error) throw error;
    } catch (error) {
      console.error('Error initializing availability settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initialize availability settings",
      });
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .eq('user_id', user.id)
        .order('blocked_date');

      if (error) throw error;

      setBlockedDates(data || []);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch blocked dates",
      });
    }
  };

  const updateDayAvailability = async (dayOfWeek: number, isAvailable: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('availability_settings')
        .update({ is_available: isAvailable })
        .eq('user_id', user.id)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;

      setWeeklySchedule(weeklySchedule.map(s =>
        s.day_of_week === dayOfWeek ? { ...s, is_available: isAvailable } : s
      ));

      toast({
        title: "Success",
        description: `${dayNames[dayOfWeek]} availability updated`,
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability",
      });
    }
  };

  const updateDayTimes = async (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('availability_settings')
        .update({ [field]: value })
        .eq('user_id', user.id)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;

      setWeeklySchedule(weeklySchedule.map(s =>
        s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
      ));

      toast({
        title: "Success",
        description: `Updated ${field === 'start_time' ? 'start' : 'end'} time for ${dayNames[dayOfWeek]}`,
      });
    } catch (error) {
      console.error('Error updating time:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update time",
      });
    }
  };

  const blockDate = async () => {
    if (!selectedDate) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('blocked_dates')
        .insert({
          blocked_date: format(selectedDate, 'yyyy-MM-dd'),
          reason: blockReason,
          user_id: user.id
        });

      if (error) throw error;

      await fetchBlockedDates();
      setSelectedDate(undefined);
      setBlockReason('');
      
      toast({
        title: "Success",
        description: "Date blocked successfully",
      });
    } catch (error) {
      console.error('Error blocking date:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block date",
      });
    }
  };

  const unblockDate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBlockedDates(blockedDates.filter(d => d.id !== id));
      
      toast({
        title: "Success",
        description: "Date unblocked successfully",
      });
    } catch (error) {
      console.error('Error unblocking date:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unblock date",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">
      <div className="text-gebeya-pink">Loading...</div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gebeya-pink mb-8">Availability Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-gebeya-pink/20">
          <CardHeader>
            <CardTitle className="text-gebeya-purple">Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklySchedule.map((setting) => (
              <div key={setting.day_of_week} className="flex items-center justify-between p-2 border border-gebeya-pink/20 rounded hover:border-gebeya-pink/40 transition-colors">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={setting.is_available}
                    onCheckedChange={(checked) => updateDayAvailability(setting.day_of_week, checked)}
                    className="data-[state=checked]:bg-gebeya-pink"
                  />
                  <Label className="w-24 font-medium text-gebeya-purple">{dayNames[setting.day_of_week]}</Label>
                </div>
                
                {setting.is_available && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={setting.start_time}
                      onChange={(e) => updateDayTimes(setting.day_of_week, 'start_time', e.target.value)}
                      className="w-32 focus:border-gebeya-pink focus:ring-gebeya-pink"
                    />
                    <span className="text-gebeya-purple">to</span>
                    <Input
                      type="time"
                      value={setting.end_time}
                      onChange={(e) => updateDayTimes(setting.day_of_week, 'end_time', e.target.value)}
                      className="w-32 focus:border-gebeya-pink focus:ring-gebeya-pink"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gebeya-pink/20">
          <CardHeader>
            <CardTitle className="text-gebeya-purple">Block Specific Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border border-gebeya-pink/20"
              disabled={(date) => date < new Date()}
              classNames={{
                day_selected: "bg-gebeya-pink text-white hover:bg-gebeya-pink/90",
                day_today: "bg-gebeya-orange/20 text-gebeya-orange",
              }}
            />
            
            {selectedDate && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Reason for blocking this date (optional)"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="focus:border-gebeya-pink focus:ring-gebeya-pink"
                />
                <Button 
                  onClick={blockDate} 
                  className="w-full bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white hover:opacity-90"
                >
                  Block {format(selectedDate, 'MMMM d, yyyy')}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium text-gebeya-purple">Blocked Dates</h3>
              <div className="space-y-2">
                {blockedDates.map((blocked) => (
                  <div 
                    key={blocked.id} 
                    className="flex items-center justify-between p-2 border border-gebeya-pink/20 rounded hover:border-gebeya-pink/40 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gebeya-purple">
                        {format(new Date(blocked.blocked_date), 'MMMM d, yyyy')}
                      </p>
                      {blocked.reason && (
                        <p className="text-sm text-gray-500">{blocked.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unblockDate(blocked.id)}
                      className="text-gebeya-pink hover:text-gebeya-orange hover:bg-transparent"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
