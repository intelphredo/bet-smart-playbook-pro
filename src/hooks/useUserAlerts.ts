import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isDevMode } from '@/utils/devMode';
import { toast } from 'sonner';

export interface UserAlert {
  id: string;
  user_id: string;
  type: 'bet_result' | 'line_movement' | 'arbitrage' | 'game_start' | 'clv_update' | 'system';
  title: string;
  message: string;
  match_id?: string;
  bet_id?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

const DEV_ALERTS: UserAlert[] = [
  {
    id: 'dev-1',
    user_id: 'dev-user',
    type: 'bet_result',
    title: 'Bet Won! 🎉',
    message: 'Lakers vs Celtics: Your moneyline bet on "Lakers" won. +$45.00',
    match_id: 'demo-match-1',
    is_read: false,
    created_at: new Date(Date.now() - 30 * 60000).toISOString()
  },
  {
    id: 'dev-2',
    user_id: 'dev-user',
    type: 'clv_update',
    title: 'Positive CLV Captured! 📈',
    message: 'Your bet closed with +3.2% CLV. You beat the closing line!',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'dev-3',
    user_id: 'dev-user',
    type: 'line_movement',
    title: 'Sharp Line Movement 📊',
    message: 'Chiefs -3.5 moved to -4.5. Consider locking in your bet.',
    match_id: 'demo-match-2',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString()
  }
];

export function useUserAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (isDevMode() && !user) {
      setAlerts(DEV_ALERTS);
      setUnreadCount(DEV_ALERTS.filter(a => !a.is_read).length);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setAlerts([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedAlerts = (data || []) as UserAlert[];
      setAlerts(typedAlerts);
      setUnreadCount(typedAlerts.filter(a => !a.is_read).length);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (alertId: string) => {
    if (isDevMode() && !user) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    if (isDevMode() && !user) {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user]);

  const deleteAlert = useCallback(async (alertId: string) => {
    if (isDevMode() && !user) {
      setAlerts(prev => {
        const alert = prev.find(a => a.id === alertId);
        if (alert && !alert.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(a => a.id !== alertId);
      });
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAlerts(prev => {
        const alert = prev.find(a => a.id === alertId);
        if (alert && !alert.is_read) {
          setUnreadCount(c => Math.max(0, c - 1));
        }
        return prev.filter(a => a.id !== alertId);
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  }, [user]);

  // Set up realtime subscription
  useEffect(() => {
    fetchAlerts();

    if (!user) return;

    const channel = supabase
      .channel('user_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newAlert = payload.new as UserAlert;
          setAlerts(prev => [newAlert, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new alerts
          toast(newAlert.title, {
            description: newAlert.message,
            duration: 5000
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAlerts]);

  return {
    alerts,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    refetch: fetchAlerts
  };
}
