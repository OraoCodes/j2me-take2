
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetupStep {
  number: number;
  title: string;
  action: string;
  completed: boolean;
  onClick?: () => void;
}

interface SetupGuideSectionProps {
  steps: SetupStep[];
}

export const SetupGuideSection = ({ steps }: SetupGuideSectionProps) => {
  // If all steps are completed, don't render the section at all
  if (steps.every(step => step.completed)) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Setup guide</h2>
          <a href="#" className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
            Tutorials
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.number} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
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
                  <h3 className="font-medium mb-2">{step.title}</h3>
                  <Button 
                    variant={step.action === "Upgrade" ? "default" : "outline"}
                    className={cn(
                      "w-full justify-center",
                      step.action === "Upgrade" ? "bg-blue-500 hover:bg-blue-600" : ""
                    )}
                    onClick={step.onClick}
                  >
                    {step.action}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
