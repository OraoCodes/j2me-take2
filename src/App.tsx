
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
import Onboarding from "@/pages/Onboarding";
import PricingPage from "@/pages/Pricing";
import ServiceShare from "@/pages/ServiceShare";
import Settings from "@/pages/Settings";
import PaymentMethods from "@/pages/PaymentMethods";
import SocialLinks from "@/pages/SocialLinks";
import StoreOptimization from "@/pages/StoreOptimization";
import PaymentPage from "@/pages/PaymentPage";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatBubble } from "@/components/chat/ChatBubble";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <ChatProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/service-page" element={<ServicePage />} />
          <Route path="/services/:userId" element={<ServicePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/add-services" element={<AddServices />} />
            <Route path="/service-created" element={<ServiceCreated />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/service-requests" element={<Dashboard initialView="service-requests" />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/service-share" element={<ServiceShare />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
            <Route path="/social-links" element={<SocialLinks />} />
            <Route path="/store-optimization" element={<StoreOptimization />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatBubble />
        <Toaster />
      </ChatProvider>
    </Router>
  );
}

export default App;
