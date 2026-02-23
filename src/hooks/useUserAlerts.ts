import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserAlert {
  id: string;
  user_id: string;
  type: 'bet_result' | 'line_movement' | 'arbitrage' | 'game_start' | 'clv_update' | 'system' | 'sharp_money' | 'reverse_line' | 'steam_move' | 'ai_confidence' | 'value_drop' | 'daily_briefing';
  title: string;
  message: string;
  match_id?: string;
  bet_id?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export function useUserAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
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
      setAlerts([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (alertId: string) => {
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
          
          // Toast notifications disabled - alerts visible in notification center only
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
