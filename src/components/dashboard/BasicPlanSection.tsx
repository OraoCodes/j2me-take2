
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, ShoppingBag, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

type TimePeriod = 'today' | 'week' | 'month';

export const BasicPlanSection = () => {
  const [viewCount, setViewCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  const [salesAmount, setSalesAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');

  const fetchData = async (period: TimePeriod) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let startDate;
      const now = new Date();
      
      switch (period) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = startOfWeek(now);
          break;
        case 'month':
          startDate = startOfMonth(now);
          break;
      }

      // Fetch view count for the selected period
      const { data: viewData, error: viewError } = await supabase
        .from('page_views')
        .select('view_count')
        .eq('user_id', user.id)
        .gte('last_viewed_at', startDate.toISOString())
        .lte('last_viewed_at', endOfDay(now).toISOString())
        .single();

      if (viewError && viewError.code !== 'PGRST116') {
        console.error("Error fetching view count:", viewError);
      }

      // Fetch request count for the selected period
      const { count: requestData, error: requestError } = await supabase
        .from('service_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endOfDay(now).toISOString());

      if (requestError) {
        console.error("Error fetching request count:", requestError);
      }

      // Fetch paid service requests with their associated service prices
      const { data: paidRequests, error: paidRequestsError } = await supabase
        .from('service_requests')
        .select(`
          *,
          services (
            price
          )
        `)
        .eq('user_id', user.id)
        .eq('paid', true)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endOfDay(now).toISOString());

      if (paidRequestsError) {
        console.error("Error fetching paid requests:", paidRequestsError);
      } else {
        // Calculate total sales from paid requests
        const totalSales = paidRequests?.reduce((sum, request) => {
          return sum + (request.services?.price || 0);
        }, 0) || 0;
        setSalesAmount(totalSales);
      }

      setViewCount(viewData?.view_count || 0);
      setRequestCount(requestData || 0);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedPeriod);
  }, [selectedPeriod]);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    setLoading(true);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => handlePeriodChange('today')}
            size="sm"
            className={cn(
              "border-gray-200",
              selectedPeriod === 'today' && "bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white border-transparent hover:text-white hover:from-gebeya-pink/90 hover:to-gebeya-orange/90"
            )}
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePeriodChange('week')}
            size="sm"
            className={cn(
              "border-gray-200",
              selectedPeriod === 'week' && "bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white border-transparent hover:text-white hover:from-gebeya-pink/90 hover:to-gebeya-orange/90"
            )}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePeriodChange('month')}
            size="sm"
            className={cn(
              "border-gray-200",
              selectedPeriod === 'month' && "bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white border-transparent hover:text-white hover:from-gebeya-pink/90 hover:to-gebeya-orange/90"
            )}
          >
            This Month
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#F1F0FB] rounded-xl p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg">
                <Eye className="w-6 h-6 text-[#9b87f5]" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Total Views</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {loading ? "-" : viewCount}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#FEF7CD] rounded-xl p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-[#f5c054]" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Service Requests</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {loading ? "-" : requestCount}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F2FCE2] rounded-xl p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-[#6ab04c]" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Total Sales</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {loading ? "-" : `Ksh ${salesAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Service requests</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">{loading ? "-" : requestCount} pending requests</span>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
            <span className="text-gray-900">{loading ? "-" : requestCount} unpaid requests</span>
          </div>
        </div>
      </div>
    </div>
  );
};
