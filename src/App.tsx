
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import CreateService from "./pages/CreateService";
import ServiceCreated from "./pages/ServiceCreated";
import AddProducts from "./pages/AddProducts";
import PaymentMethods from "./pages/PaymentMethods";
import SocialLinks from "./pages/SocialLinks";
import StoreOptimization from "./pages/StoreOptimization";
import ServiceShare from "./pages/ServiceShare";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/create-service" element={<CreateService />} />
          <Route path="/service-created" element={<ServiceCreated />} />
          <Route path="/add-products" element={<AddProducts />} />
          <Route path="/payment-methods" element={<PaymentMethods />} />
          <Route path="/social-links" element={<SocialLinks />} />
          <Route path="/store-optimization" element={<StoreOptimization />} />
          <Route path="/service-share" element={<ServiceShare />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
