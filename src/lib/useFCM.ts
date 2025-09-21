import { messaging } from "@/lib/firebase";
import { getToken, isSupported, MessagePayload, onMessage } from "firebase/messaging";
import { useEffect, useState } from "react";

const useNotificationPermission = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  useEffect(() => {
    const handler = () => setPermission(Notification.permission);
    handler();
    Notification.requestPermission().then(handler);
    navigator.permissions.query({ name: "notifications" }).then((notificationPerm) => {
      notificationPerm.onchange = handler;
    });
  }, []);
  return permission;
};

const useFCMToken = () => {
  const permission = useNotificationPermission();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  useEffect(() => {
    const retrieveToken = async () => {
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        if (permission === "granted") {
          const isFCMSupported = await isSupported();
          if (!isFCMSupported) return;
          const fcmToken = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          });
          setFcmToken(fcmToken);
        }
      }
    };
    retrieveToken();
  }, [permission]);
  return fcmToken;
};

export const useFCM = () => {
  const fcmToken = useFCMToken();
  const [messages, setMessages] = useState<MessagePayload[]>([]);
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const fcmMessaging = messaging;
      const unsubscribe = onMessage(fcmMessaging, (payload) => {
        setMessages((messages) => [...messages, payload]);
      });
      return () => unsubscribe();
    }
  }, [fcmToken]);
  return { fcmToken, messages };
};
