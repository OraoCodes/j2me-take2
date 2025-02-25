import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Pencil, Trash, Calendar, DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BasicPlanSection } from "@/components/dashboard/BasicPlanSection";
import { SetupGuideSection } from "@/components/dashboard/SetupGuideSection";
import { EmptyState } from "@/components/dashboard/empty-state";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching services:", error);
          toast({
            title: "Error",
            description: "Failed to fetch services. Please try again.",
            variant: "destructive",
          });
        } else {
          setServices(data || []);
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) {
        console.error("Error deleting service:", error);
        toast({
          title: "Error",
          description: "Failed to delete service. Please try again.",
          variant: "destructive",
        });
      } else {
        setServices(services.filter((service) => service.id !== serviceId));
        toast({
          title: "Success",
          description: "Service deleted successfully.",
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ServiceCard = ({ service }: { service: any }) => (
    <Card className="w-full bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">{service.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/edit-service/${service.id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDeleteService(service.id)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 opacity-70" />
            <span className="text-sm text-muted-foreground">
              {new Date(service.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4 opacity-70" />
            <span className="text-sm text-muted-foreground">
              KES {service.price}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <a 
          href={`/services/${service.user_id}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-full"
        >
          <Button className="w-full bg-gebeya-pink hover:bg-gebeya-orange">
            View Service Page
          </Button>
        </a>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <DashboardHeader isMobileMenuOpen={false} toggleMobileMenu={() => {}} profile={null} />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <BasicPlanSection />
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Services</h2>
                <a 
                  href={`/services/${user?.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gebeya-pink hover:text-gebeya-orange transition-colors duration-200"
                >
                  View All Services →
                </a>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <Skeleton key={n} className="h-[200px] w-full" />
                  ))}
                </div>
              ) : services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
          <div className="space-y-6">
            <SetupGuideSection steps={[]} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
