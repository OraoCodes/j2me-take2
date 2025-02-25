
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const BasicPlanSection = () => {
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViewCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('page_views')
          .select('view_count')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching view count:", error);
          return;
        }

        setViewCount(data?.view_count || 0);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchViewCount();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <div className="text-sm text-gray-600">February 18, 2025 — February 25, 2025</div>
        </div>
        <div className="text-sm text-gray-500">
          Premium plan or higher plan is required to change date range
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Views</div>
            <div className="text-2xl font-semibold">
              {loading ? "-" : viewCount}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Service requests</div>
            <div className="text-2xl font-semibold">2</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Sales</div>
            <div className="text-2xl font-semibold">Ksh 0.00</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Service requests</h3>
          <div className="text-sm text-gray-500">Last 30 days</div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-100">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">2 pending requests</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-100">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">2 unpaid requests</span>
          </div>
        </div>
      </div>
    </div>
  );
};
