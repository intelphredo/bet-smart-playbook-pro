import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isDevMode } from "@/utils/devMode";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  isSubscribed: boolean;
  isLoading: boolean;
}

export function usePushNotifications() {
  const { toast } = useToast();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    isLoading: true,
  });

  // Check if push notifications are supported
  const checkSupport = useCallback(() => {
    const supported = 
      "serviceWorker" in navigator && 
      "PushManager" in window && 
      "Notification" in window;
    
    return supported;
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      console.log("Service Worker registered:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }, []);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState(prev => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission,
        isSubscribed: !!subscription,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to check subscription:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [checkSupport]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive alerts for your bets.",
        });
        return true;
      } else if (permission === "denied") {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
        return false;
      }
      
      return false;
    } catch (error) {
      console.error("Failed to request permission:", error);
      return false;
    }
  }, [checkSupport, toast]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (isDevMode()) {
      toast({
        title: "Dev Mode",
        description: "Push subscriptions are simulated in dev mode.",
      });
      setState(prev => ({ ...prev, isSubscribed: true }));
      return true;
    }

    try {
      // First ensure we have permission
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error("Failed to register service worker");
      }

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push
      // Note: In production, you'd use your VAPID public key here
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // applicationServerKey would go here with your VAPID public key
      });

      console.log("Push subscription:", subscription);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login Required",
          description: "Please log in to enable notifications.",
          variant: "destructive",
        });
        return false;
      }

      // Save subscription to database
      const subscriptionData = subscription.toJSON();
      const { error } = await supabase
        .from("push_subscriptions" as any)
        .insert({
          user_id: user.id,
          subscription: subscriptionData,
        } as any);

      // Handle duplicate - that's fine
      if (error && error.code !== "23505") {
        console.error("Failed to save subscription:", error);
        throw error;
      }

      setState(prev => ({ ...prev, isSubscribed: true }));
      toast({
        title: "Subscribed!",
        description: "You'll receive push notifications for bet updates.",
      });

      return true;
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast({
        title: "Subscription Failed",
        description: "Could not enable push notifications.",
        variant: "destructive",
      });
      return false;
    }
  }, [requestPermission, registerServiceWorker, toast]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      if (isDevMode()) {
        setState(prev => ({ ...prev, isSubscribed: false }));
        toast({
          title: "Unsubscribed",
          description: "You won't receive push notifications.",
        });
        return true;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("push_subscriptions" as any)
            .delete()
            .eq("user_id", user.id);
        }
      }

      setState(prev => ({ ...prev, isSubscribed: false }));
      toast({
        title: "Unsubscribed",
        description: "You won't receive push notifications.",
      });

      return true;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      return false;
    }
  }, [toast]);

  // Send a test notification
  const sendTestNotification = useCallback(async () => {
    if (Notification.permission === "granted") {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Test Notification 🏈", {
        body: "Push notifications are working!",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      if (checkSupport()) {
        await registerServiceWorker();
        await checkSubscription();
      } else {
        setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      }
    };

    init();
  }, [checkSupport, registerServiceWorker, checkSubscription]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
