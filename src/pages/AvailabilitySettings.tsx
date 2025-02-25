
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    const { data, error } = await supabase
      .from('availability_settings')
      .select('*')
      .order('day_of_week');

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch availability settings",
      });
      return;
    }

    setWeeklySchedule(data);
    setLoading(false);
  };

  const fetchBlockedDates = async () => {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('blocked_date');

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch blocked dates",
      });
      return;
    }

    setBlockedDates(data);
  };

  const updateDayAvailability = async (dayOfWeek: number, isAvailable: boolean) => {
    const setting = weeklySchedule.find(s => s.day_of_week === dayOfWeek);
    if (!setting) return;

    const { error } = await supabase
      .from('availability_settings')
      .update({ is_available: isAvailable })
      .eq('day_of_week', dayOfWeek);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability",
      });
      return;
    }

    setWeeklySchedule(weeklySchedule.map(s =>
      s.day_of_week === dayOfWeek ? { ...s, is_available: isAvailable } : s
    ));

    toast({
      title: "Success",
      description: `${dayNames[dayOfWeek]} availability updated`,
    });
  };

  const updateDayTimes = async (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    const { error } = await supabase
      .from('availability_settings')
      .update({ [field]: value })
      .eq('day_of_week', dayOfWeek);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update time",
      });
      return;
    }

    setWeeklySchedule(weeklySchedule.map(s =>
      s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s
    ));
  };

  const blockDate = async () => {
    if (!selectedDate) return;

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to block dates",
      });
      return;
    }

    const { error } = await supabase
      .from('blocked_dates')
      .insert({
        blocked_date: format(selectedDate, 'yyyy-MM-dd'),
        reason: blockReason,
        user_id: session.user.id // Add the user_id here
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block date",
      });
      return;
    }

    await fetchBlockedDates();
    setSelectedDate(undefined);
    setBlockReason('');
    
    toast({
      title: "Success",
      description: "Date blocked successfully",
    });
  };

  const unblockDate = async (id: string) => {
    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unblock date",
      });
      return;
    }

    setBlockedDates(blockedDates.filter(d => d.id !== id));
    
    toast({
      title: "Success",
      description: "Date unblocked successfully",
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Availability Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklySchedule.map((setting) => (
              <div key={setting.day_of_week} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={setting.is_available}
                    onCheckedChange={(checked) => updateDayAvailability(setting.day_of_week, checked)}
                  />
                  <Label className="w-24">{dayNames[setting.day_of_week]}</Label>
                </div>
                
                {setting.is_available && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={setting.start_time}
                      onChange={(e) => updateDayTimes(setting.day_of_week, 'start_time', e.target.value)}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={setting.end_time}
                      onChange={(e) => updateDayTimes(setting.day_of_week, 'end_time', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Block Specific Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
            
            {selectedDate && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Reason for blocking this date (optional)"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
                <Button onClick={blockDate} className="w-full">
                  Block {format(selectedDate, 'MMMM d, yyyy')}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium">Blocked Dates</h3>
              <div className="space-y-2">
                {blockedDates.map((blocked) => (
                  <div key={blocked.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">
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
