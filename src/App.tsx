
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ServicePage from "@/pages/ServicePage";
import AddServices from "@/pages/AddServices";
import ServiceCreated from "@/pages/ServiceCreated";
import Dashboard from "@/pages/Dashboard";
import ProfilePage from "@/pages/ProfilePage";
import EditService from "@/pages/EditService";
import Onboarding from "@/pages/Onboarding";
import PricingPage from "@/pages/Pricing";
import ServiceShare from "@/pages/ServiceShare";
import CreateServicePage from "@/pages/CreateServicePage";
import PaymentMethods from "@/pages/PaymentMethods";
import SocialLinks from "@/pages/SocialLinks";
import StoreOptimization from "@/pages/StoreOptimization";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/service-page" element={<ServicePage />} />
        <Route path="/services/:userId" element={<ServicePage />} />
        <Route path="/add-services" element={<AddServices />} />
        <Route path="/service-created" element={<ServiceCreated />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edit-service/:serviceId" element={<EditService />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/service-share" element={<ServiceShare />} />
        <Route path="/settings" element={<CreateServicePage />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path="/social-links" element={<SocialLinks />} />
        <Route path="/store-optimization" element={<StoreOptimization />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
