import { useCallback } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

export const usePushNotifications = () => {
  const { user } = useAuthStore();
  const { updateUserConfig } = useDataStore();

  const subscribeUser = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão negada para notificações');
      }

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe
        // Note: Real VAPID keys should be provided here in production
        // For simulation/dev, we just grab what we can
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BD8I-K1L1S2T3A4C5T6I7C8A9L0B1R2A3N4D5I6N7G' // Placeholder VAPID Payload
        });
      }

      if (subscription && user?.id) {
        await updateUserConfig(user.id, { 
          push_subscription: subscription.toJSON() as any 
        });
        toast.success('Notificações ativadas com sucesso!');
      }
    } catch (err: any) {
      console.error('Falha ao inscrever para Push:', err);
      toast.error(err.message || 'Erro ao ativar notificações');
    }
  }, [user, updateUserConfig]);

  return { subscribeUser };
};
