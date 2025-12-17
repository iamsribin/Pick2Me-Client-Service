import { AdminApiEndpoints } from "@/constants/admin-api-end-pointes";
import { postData } from "../services/api/api-service";

export async function registerPush(): Promise<void> {
  try {

    console.log("registerPush");

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }
    const appServerKey = import.meta.env.VITE_VAPID_PUBLIC
    const registration: ServiceWorkerRegistration =
      await navigator.serviceWorker.register('/sw.js');

    const permission: NotificationPermission =
      await Notification.requestPermission();

    if (permission !== 'granted') {
      return;
    }

    let subscription: PushSubscription | null =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(appServerKey) as BufferSource
      });
    }

    await postData(AdminApiEndpoints.ADD_SUBSCRIPTION, subscription);
  } catch (error) {
    console.error(error);

  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }

  return output;
}

