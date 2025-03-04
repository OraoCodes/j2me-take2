import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Loader2, Info, Edit2, DollarSign, CalendarClock, Calendar as CalendarIcon, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ServiceCheckoutDialog } from "@/components/service-checkout/ServiceCheckoutDialog";
import TimeSlotView from './TimeSlotView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ServiceRequest {
  id: string;
  service_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  scheduled_at: string;
  paid: boolean;
  services: {
    name: string;
    price: number;
  };
}

const ServiceRequestsView = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
    checkTelegramConnection();
    setupRealtimeSubscription();
  }, []);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('service_requests_changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public',
        table: 'service_requests' 
      }, (payload) => {
        console.log('New service request received:', payload);
        // Only fetch the new request if it belongs to the current user
        if (payload.new && payload.new.user_id) {
          fetchNewRequest(payload.new.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchNewRequest = async (requestId: string) => {
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (
            name,
            price
          )
        `)
        .eq('id', requestId)
        .eq('user_id', userData.user.id) // Ensure it belongs to current user
        .single();

      if (error) throw error;

      if (data) {
        setRequests(prevRequests => [data, ...prevRequests]);
        toast({
          title: "New Service Request",
          description: `${data.customer_name} requested ${data.services.name}`,
        });
        sendTelegramNotification(data);
      }
    } catch (error) {
      console.error('Error fetching new request:', error);
    }
  };

  const sendTelegramNotification = async (request: ServiceRequest) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;
      
      const scheduledTime = request.scheduled_at ? format(parseISO(request.scheduled_at), 'PPP p') : 'Not scheduled';
      const formattedPrice = request.services.price.toLocaleString();
      
      const message = `
🎉 <b>You Have a New Service Request!</b>

<b>Service:</b> ${request.services.name}
<b>Price:</b> KES ${formattedPrice}

<b>Customer Details:</b>
👤 ${request.customer_name}
${request.customer_phone ? `📞 ${request.customer_phone}` : ''}
${request.customer_email ? `📧 ${request.customer_email}` : ''}

<b>Appointment:</b> ${scheduledTime}

${request.notes ? `<b>Special Requests:</b>\n${request.notes}` : ''}

<i>You can manage this request in your Gebeya dashboard.</i>
`;

      const response = await fetch('/functions/v1/telegram-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.id,
          notification: message
        }),
      });

      const result = await response.json();
      console.log('Telegram notification result:', result);
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  };

  const checkTelegramConnection = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data, error } = await supabase
        .from('user_telegram_connections')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (!error && data) {
        setIsTelegramConnected(true);
      } else {
        console.log('No Telegram connection found:', error);
      }
    } catch (error) {
      console.error('Error checking Telegram connection:', error);
    }
  };

  const generateTelegramLink = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to connect Telegram",
        });
        return;
      }

      const botUsername = 'gebeya_services_bot';
      const link = `https://t.me/${botUsername}?start=${userData.user.id}`;
      
      window.open(link, '_blank');
      
      toast({
        title: "Telegram Connection",
        description: "Please follow the instructions in Telegram to connect your account",
      });
    } catch (error) {
      console.error('Error generating Telegram link:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate Telegram connection link",
      });
    }
  };

  const fetchRequests = async () => {
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (
            name,
            price
          )
        `)
        .eq('user_id', userData.user.id) // Filter by current user's ID
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      console.log('Fetched service requests:', data);
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch service requests",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(requests.map(request => 
        request.id === requestId 
          ? { ...request, status: newStatus }
          : request
      ));

      toast({
        title: "Success",
        description: "Request status updated successfully",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update request status",
      });
    }
  };

  const togglePaidStatus = async (requestId: string, currentPaidStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ paid: !currentPaidStatus })
        .eq('id', requestId);

      if (error) throw error;

      setRequests(requests.map(request => 
        request.id === requestId 
          ? { ...request, paid: !currentPaidStatus }
          : request
      ));

      toast({
        title: "Success",
        description: `Service request marked as ${!currentPaidStatus ? 'paid' : 'unpaid'}`,
      });
    } catch (error) {
      console.error('Error toggling paid status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment status",
      });
    }
  };

  const handleEditRequest = (request: ServiceRequest) => {
    setEditingRequest(request);
  };

  const handleEditComplete = () => {
    setEditingRequest(null);
    fetchRequests();
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getRequestsForDate = (date: Date | undefined) => {
    if (!date) return [];
    const dateString = format(date, 'yyyy-MM-dd');
    return requests.filter(request => {
      if (!request.scheduled_at) return false;
      return format(parseISO(request.scheduled_at), 'yyyy-MM-dd') === dateString;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gebeya-pink" />
      </div>
    );
  }

  const upcomingRequests = requests.filter(request => {
    if (!request.scheduled_at) return false;
    const scheduledDate = parseISO(request.scheduled_at);
    return scheduledDate >= new Date() && request.status !== 'rejected';
  });

  const allRequestsSorted = [...requests].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gebeya-pink">Service Requests</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gebeya-pink" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Manage your customer service requests</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <Button
            onClick={generateTelegramLink}
            variant={isTelegramConnected ? "outline" : "default"}
            className={isTelegramConnected ? "bg-green-50 text-green-700 border-green-200" : ""}
          >
            {isTelegramConnected 
              ? "Telegram Connected ✓" 
              : "Connect Telegram Notifications"}
          </Button>
        </div>
      </div>

      {editingRequest && (
        <ServiceCheckoutDialog
          isOpen={true}
          onClose={handleEditComplete}
          service={{
            id: editingRequest.service_id,
            name: editingRequest.services.name,
            price: editingRequest.services.price,
            description: null,
            user_id: editingRequest.user_id,
            instant_booking: false
          }}
          initialData={{
            name: editingRequest.customer_name,
            email: editingRequest.customer_email || "",
            phone: editingRequest.customer_phone || "",
            notes: editingRequest.notes || "",
            scheduled_at: parseISO(editingRequest.scheduled_at)
          }}
          isEditing={true}
          requestId={editingRequest.id}
        />
      )}

      <Tabs defaultValue="upcoming" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <span>Upcoming Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span>All Requests</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingRequests.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Your next scheduled sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg space-y-3 bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{request.services.name}</h3>
                          <p className="text-sm text-gray-500">
                            {request.customer_name} {request.customer_phone ? `- ${request.customer_phone}` : ''}
                          </p>
                          {request.scheduled_at && (
                            <p className="text-sm font-medium text-gebeya-pink">
                              Scheduled for: {format(parseISO(request.scheduled_at), 'PPP p')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(request.status)}
                          {request.paid && (
                            <Badge className="bg-green-100 text-green-800">PAID</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={request.status}
                          onValueChange={(value) => updateRequestStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accept</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                            <SelectItem value="completed">Complete</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRequest(request)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant={request.paid ? "outline" : "default"}
                          size="sm"
                          onClick={() => togglePaidStatus(request.id, request.paid)}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          {request.paid ? 'Mark Unpaid' : 'Mark Paid'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center p-12 bg-white rounded-lg shadow-sm">
              <CalendarClock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Upcoming Appointments</h3>
              <p className="text-gray-500">You don't have any upcoming appointments scheduled.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Calendar View</CardTitle>
                  <CardDescription>View requests by date</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    modifiers={{
                      booked: (date) => 
                        requests.some(request => 
                          request.scheduled_at && 
                          format(parseISO(request.scheduled_at), 'yyyy-MM-dd') === 
                          format(date, 'yyyy-MM-dd')
                        )
                    }}
                    modifiersStyles={{
                      booked: { 
                        fontWeight: 'bold',
                        backgroundColor: '#fce7f3',
                        color: '#be185d'
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {selectedDate && (
                <TimeSlotView 
                  date={selectedDate} 
                  requests={getRequestsForDate(selectedDate)}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Requests</CardTitle>
              <CardDescription>View and manage all service requests</CardDescription>
            </CardHeader>
            <CardContent>
              {allRequestsSorted.length > 0 ? (
                <div className="space-y-4">
                  {allRequestsSorted.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{request.services.name}</h3>
                          <p className="text-sm text-gray-500">
                            {request.customer_name} {request.customer_phone ? `- ${request.customer_phone}` : ''}
                          </p>
                          {request.scheduled_at && (
                            <p className="text-sm text-gray-500">
                              Scheduled for: {format(parseISO(request.scheduled_at), 'PPP p')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(request.status)}
                          {request.paid && (
                            <Badge className="bg-green-100 text-green-800">PAID</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={request.status}
                          onValueChange={(value) => updateRequestStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="accepted">Accept</SelectItem>
                            <SelectItem value="rejected">Reject</SelectItem>
                            <SelectItem value="completed">Complete</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRequest(request)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant={request.paid ? "outline" : "default"}
                          size="sm"
                          onClick={() => togglePaidStatus(request.id, request.paid)}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          {request.paid ? 'Mark Unpaid' : 'Mark Paid'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12">
                  <ListChecks className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No Service Requests</h3>
                  <p className="text-gray-500">You don't have any service requests yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ServiceRequestsView;
