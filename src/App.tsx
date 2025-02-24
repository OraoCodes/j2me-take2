
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/NotFound";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import ServicePage from "@/pages/ServicePage";
import AddServices from "@/pages/AddServices";
import ServiceCreated from "@/pages/ServiceCreated";
import Dashboard from "@/pages/Dashboard";
import ServiceCategories from "@/pages/ServiceCategories";
import ProfilePage from "@/pages/ProfilePage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/service-page" element={<ServicePage />} />
        <Route path="/services/:userId" element={<ServicePage />} />
        <Route path="/add-services" element={<AddServices />} />
        <Route path="/service-created" element={<ServiceCreated />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/service-categories" element={<ServiceCategories />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
