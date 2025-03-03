
/**
 * Utility functions for handling webhook notifications
 */

const N8N_WEBHOOK_URL = 'https://martinndlovu.app.n8n.cloud/webhook-test/16091124-b34e-4c6e-a8f3-7a5856532bac';

/**
 * Send a service request notification to the n8n webhook
 */
export const sendServiceRequestNotification = async (data: any) => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Error sending webhook notification: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending webhook notification:', error);
    throw error;
  }
};

/**
 * Format service request data for webhook notification
 */
export const formatServiceRequestForWebhook = (
  service: {
    id: string;
    name: string;
    price: number;
    instant_booking: boolean;
    serviceMode?: string;
  },
  customer: {
    name: string;
    email?: string;
    phone: string;
    notes?: string;
    location?: string;
  },
  appointment: {
    scheduledAt: Date;
    requestId?: string;
  }
) => {
  return {
    // Service details
    serviceName: service.name,
    servicePrice: `KES ${service.price.toLocaleString()}`,
    serviceStatus: service.instant_booking ? 'accepted' : 'pending',
    
    // Customer details
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email || "Not provided",
    
    // Appointment details
    appointmentDate: appointment.scheduledAt.toISOString(),
    formattedAppointmentDate: new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(appointment.scheduledAt),
    specialRequests: customer.notes || "None",
    
    // Location if applicable
    location: service.serviceMode === 'client-location' ? customer.location : "Provider location",
    
    // Request metadata
    requestId: appointment.requestId || "Unknown",
    timestamp: new Date().toISOString()
  };
};
