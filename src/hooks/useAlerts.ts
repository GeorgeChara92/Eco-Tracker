import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface Alert {
  id: string;
  user_id: string;
  asset_symbol: string;
  alert_type: 'price' | 'percentage';
  condition: 'above' | 'below';
  value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  metadata: any;
  is_read: boolean;
  created_at: string;
}

export function useAlerts() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['alerts', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      try {
        const response = await fetch('/api/alerts');
        if (!response.ok) {
          throw new Error('Failed to fetch alerts');
        }
        const data = await response.json();
        return data as Alert[];
      } catch (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }
    },
    enabled: !!session?.user?.id,
  });

  const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['notifications', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      try {
        const response = await fetch('/api/notifications');
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        return data as Notification[];
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
    },
    enabled: !!session?.user?.id,
  });

  const invalidateAlerts = () => {
    queryClient.invalidateQueries({ queryKey: ['alerts', session?.user?.id] });
  };

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', session?.user?.id] });
  };

  return {
    alerts: alerts || [],
    notifications: notifications || [],
    isLoading: isLoadingAlerts || isLoadingNotifications,
    invalidateAlerts,
    invalidateNotifications,
  };
} 