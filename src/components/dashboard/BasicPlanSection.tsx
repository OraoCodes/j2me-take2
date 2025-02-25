
import { Button } from "@/components/ui/button";
import { Settings, FileText, Users, MessageCircle, ChevronRight } from "lucide-react";

export const BasicPlanSection = () => {
  const items = [
    { icon: <Settings className="w-5 h-5" />, label: "Setup wizard" },
    { icon: <FileText className="w-5 h-5" />, label: "Getting started" },
    { icon: <Users className="w-5 h-5" />, label: "Subscriber guide" },
    { icon: <MessageCircle className="w-5 h-5" />, label: "Helpdesk" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold mb-4">Basic plan</h3>
      <div className="space-y-4">
        {items.map((item) => (
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
  );
};
