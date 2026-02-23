import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { isDevMode } from "@/utils/devMode";

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  isSubscribed: boolean;
  isLoading: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: "default",
    isSubscribed: false,
    isLoading: true,
  });

  const checkSupport = useCallback(() => {
    const supported = 
      "serviceWorker" in navigator && 
      "PushManager" in window && 
      "Notification" in window;
    return supported;
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return null;
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      console.log("Service Worker registered:", registration.scope);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return null;
    }
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState(prev => ({ ...prev, isSupported: false, isLoading: false }));
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
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

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!checkSupport()) {
      toast.error("Not Supported", { description: "Push notifications are not supported in your browser." });
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));
      if (permission === "granted") {
        toast.success("Notifications Enabled", { description: "You'll receive alerts for your bets." });
        return true;
      } else if (permission === "denied") {
        toast.error("Notifications Blocked", { description: "Please enable notifications in your browser settings." });
        return false;
      }
      return false;
    } catch (error) {
      console.error("Failed to request permission:", error);
      return false;
    }
  }, [checkSupport]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (isDevMode()) {
      toast("Dev Mode", { description: "Push subscriptions are simulated in dev mode." });
      setState(prev => ({ ...prev, isSubscribed: true }));
      return true;
    }
    try {
      if (Notification.permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }
      const registration = await registerServiceWorker();
      if (!registration) throw new Error("Failed to register service worker");
      await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.subscribe({
        userVisibleOnly: true,
      });
      console.log("Push subscription:", subscription);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Login Required", { description: "Please log in to enable notifications." });
        return false;
      }
      const subscriptionData = subscription.toJSON();
      const { error } = await supabase
        .from("push_subscriptions" as any)
        .insert({ user_id: user.id, subscription: subscriptionData } as any);
      if (error && error.code !== "23505") {
        console.error("Failed to save subscription:", error);
        throw error;
      }
      setState(prev => ({ ...prev, isSubscribed: true }));
      toast.success("Subscribed!", { description: "You'll receive push notifications for bet updates." });
      return true;
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error("Subscription Failed", { description: "Could not enable push notifications." });
      return false;
    }
  }, [requestPermission, registerServiceWorker]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      if (isDevMode()) {
        setState(prev => ({ ...prev, isSubscribed: false }));
        toast("Unsubscribed", { description: "You won't receive push notifications." });
        return true;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await (registration as any).pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("push_subscriptions" as any).delete().eq("user_id", user.id);
        }
      }
      setState(prev => ({ ...prev, isSubscribed: false }));
      toast("Unsubscribed", { description: "You won't receive push notifications." });
      return true;
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      return false;
    }
  }, []);

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