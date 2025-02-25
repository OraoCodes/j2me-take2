import { Button } from "@/components/ui/button";
import { Settings, FileText, Users, MessageCircle, ChevronRight } from "lucide-react";
export const BasicPlanSection = () => {
  const items = [{
    icon: <Settings className="w-5 h-5" />,
    label: "Setup wizard"
  }, {
    icon: <FileText className="w-5 h-5" />,
    label: "Getting started"
  }, {
    icon: <Users className="w-5 h-5" />,
    label: "Subscriber guide"
  }, {
    icon: <MessageCircle className="w-5 h-5" />,
    label: "Helpdesk"
  }];
  return;
};