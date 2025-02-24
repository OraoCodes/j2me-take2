
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { 
  Home,
  Package,
  Grid,
  Users,
  PenTool,
  Settings,
  Tag, 
  BarChart, 
  FileText, 
  CalendarClock, 
  MessageCircle, 
  Inbox, 
  BadgeDollarSign,
  ChevronRight,
  MessagesSquare,
  ScrollText
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const sidebarItems = [
    { icon: <Home />, label: "Dashboard", active: true },
    { icon: <Grid />, label: "Orders" },
    { icon: <Package />, label: "Products" },
    { icon: <Users />, label: "Customers" },
    { icon: <PenTool />, label: "Design" },
    { icon: <Settings />, label: "Settings" },
  ];

  const premiumFeatures = [
    { icon: <Tag />, label: "Discounts", badge: "PREMIUM" },
    { icon: <MessagesSquare />, label: "Reviews", badge: "PREMIUM" },
    { icon: <BarChart />, label: "Analytics", badge: "PREMIUM" },
    { icon: <ScrollText />, label: "Pages", badge: "PREMIUM" },
    { icon: <CalendarClock />, label: "Booking", badge: "PREMIUM" },
  ];

  const businessFeatures = [
    { icon: <MessageCircle />, label: "WhatsApp Business", badge: "BUSINESS" },
    { icon: <Inbox />, label: "Inbox", badge: "BUSINESS" },
    { icon: <BadgeDollarSign />, label: "Marketing" },
  ];

  const setupSteps = [
    { number: 1, title: "Add your first product", action: "Add product", completed: true },
    { number: 2, title: "Create your first order", action: "Create order", completed: false },
    { number: 3, title: "Add delivery options", action: "Add delivery", completed: true },
    { number: 4, title: "Set up payment methods", action: "Add payment", completed: false },
    { number: 5, title: "Set up custom domain", action: "Upgrade", completed: false },
    { number: 6, title: "Invite staff", action: "Upgrade", completed: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 py-6">
        <div className="px-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <img src="/lovable-uploads/bc4b57d4-e29b-4e44-8e1c-82ec09ca6fd6.png" alt="Logo" className="h-8 w-8" />
            <div>
              <h2 className="font-semibold">KicksandSneakers</h2>
              <p className="text-sm text-gray-500">take.app/kicksandsneakers</p>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <nav className="space-y-1 px-3">
          {sidebarItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                item.active 
                  ? "bg-gray-100 text-gray-900" 
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-8">
          <p className="px-6 text-xs font-medium text-gray-400 uppercase mb-2">Apps</p>
          <nav className="space-y-1 px-3">
            {[...premiumFeatures, ...businessFeatures].map((item) => (
              <a
                key={item.label}
                href="#"
                className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.badge && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.badge === "PREMIUM" 
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <Header />
        <div className="p-8">
          <div className="max-w-5xl mx-auto">
            {/* Setup Guide */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Setup guide</h2>
                  <a href="#" className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                    Tutorials
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="space-y-4">
                  {setupSteps.map((step) => (
                    <div key={step.number} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {step.completed ? (
                          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          step.number
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.title}</p>
                      </div>
                      <Button 
                        variant={step.action === "Upgrade" ? "default" : "outline"}
                        className={step.action === "Upgrade" ? "bg-blue-500 hover:bg-blue-600" : ""}
                      >
                        {step.action}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="border-t border-gray-100 p-6">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="text-gray-600 mb-1">Views</p>
                    <p className="text-2xl font-semibold">0</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Orders</p>
                    <p className="text-2xl font-semibold">0</p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">Sales</p>
                    <p className="text-2xl font-semibold">KSh 0.00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Plan Card */}
            <div className="bg-gradient-to-r from-gebeya-pink to-gebeya-orange p-6 rounded-xl text-white mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Subscribe now at $1</h3>
                  <p className="text-white/90 mb-4">
                    Kickstart a strong 2025 with our Premium Plan - Now just $1 (originally $19)
                  </p>
                  <Button variant="secondary" className="bg-white text-gebeya-pink hover:bg-white/90">
                    Upgrade
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Basic plan</h3>
              <div className="space-y-4">
                {[
                  { icon: <Settings className="w-5 h-5" />, label: "Setup wizard" },
                  { icon: <FileText className="w-5 h-5" />, label: "Getting started" },
                  { icon: <Users className="w-5 h-5" />, label: "Subscriber guide" },
                  { icon: <MessageCircle className="w-5 h-5" />, label: "Helpdesk" },
                ].map((item) => (
                  <a
                    key={item.label}
                    href="#"
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
