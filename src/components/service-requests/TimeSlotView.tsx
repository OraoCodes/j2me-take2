
import React from 'react';
import { format, parseISO, eachHourOfInterval, set, isWithinInterval } from 'date-fns';
import { cn } from "@/lib/utils";

interface TimeSlotViewProps {
  date: Date;
  requests: Array<{
    id: string;
    scheduled_at: string;
    customer_name: string;
    services: {
      name: string;
    };
    status: string;
  }>;
}

const TimeSlotView = ({ date, requests }: TimeSlotViewProps) => {
  // Create array of hours from 6 AM to 10 PM
  const hours = eachHourOfInterval({
    start: set(date, { hours: 6, minutes: 0 }),
    end: set(date, { hours: 22, minutes: 0 })
  });

  const getRequestsForHour = (hour: Date) => {
    return requests.filter(request => {
      const requestTime = parseISO(request.scheduled_at);
      const hourEnd = set(hour, { minutes: 59, seconds: 59 });
      return isWithinInterval(requestTime, { start: hour, end: hourEnd });
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      accepted: "bg-green-500",
      rejected: "bg-red-500",
      completed: "bg-blue-500"
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="border rounded-lg shadow bg-white">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gebeya-purple">
          {format(date, 'MMMM d, yyyy')}
        </h3>
      </div>
      <div className="divide-y">
        {hours.map((hour) => {
          const hourRequests = getRequestsForHour(hour);
          return (
            <div
              key={hour.toISOString()}
              className="flex items-start p-2 hover:bg-gray-50 min-h-[60px] relative group"
            >
              <div className="w-16 flex-shrink-0 text-sm text-gray-500">
                {format(hour, 'h:mm a')}
              </div>
              <div className="flex-1 space-y-1">
                {hourRequests.map((request) => (
                  <div
                    key={request.id}
                    className={cn(
                      "rounded px-2 py-1 text-white text-sm mb-1 transition-opacity",
                      getStatusColor(request.status)
                    )}
                  >
                    <div className="font-medium">{request.services.name}</div>
                    <div className="text-xs opacity-90">{request.customer_name}</div>
                    <div className="text-xs">{format(parseISO(request.scheduled_at), 'h:mm a')}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotView;
