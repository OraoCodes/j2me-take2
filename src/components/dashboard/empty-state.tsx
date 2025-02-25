
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">No services created yet</h3>
        <p className="text-sm text-gray-500">Get started by creating your first service.</p>
        <Button onClick={() => navigate("/add-services")} className="bg-gebeya-pink hover:bg-gebeya-orange">
          <Plus className="w-4 h-4 mr-2" />
          Create Service
        </Button>
      </div>
    </div>
  );
};
