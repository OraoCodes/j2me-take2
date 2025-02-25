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
import { Loader2, Info, Edit2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ServiceCheckoutDialog } from "@/components/service-checkout/ServiceCheckoutDialog";
import TimeSlotView from './TimeSlotView';

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
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (
            name,
            price
          )
        `)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
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
    fetchRequests(); // Refresh the requests list
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

  return (
    <>
      <div className="flex items-center justify-between mb-8">
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

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
            <CardDescription>View and manage all service requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{request.services.name}</h3>
                      <p className="text-sm text-gray-500">
                        {request.customer_name} - {request.customer_phone}
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
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ServiceRequestsView;
