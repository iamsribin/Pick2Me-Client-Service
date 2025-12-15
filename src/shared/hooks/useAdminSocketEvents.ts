import { useEffect } from 'react';
import SocketService from '@/shared/services/socketService';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, store } from '@/shared/services/redux/store';
import { incrementUnread } from '../services/redux/slices/issuesSlice'; 
import { toast } from './use-toast';

export function useAdminSocketEvents() {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (user.role !== 'Admin') return;
    SocketService.connect();

    const offNotification = SocketService.on('issue:created', (data) => {
        
      dispatch(incrementUnread());
      toast({ description: 'New issue reported', variant: 'default' });
      if ('setAppBadge' in navigator) {
        navigator.setAppBadge?.(store.getState().issues.unreadCount);
      } else {
        document.title = `(${store.getState().issues.unreadCount}) Admin Panel`;
      }
    });

    const offError = SocketService.on('error', (data) => {
      toast({ description: data.message, variant: 'error' });
    });

    return () => {
      offNotification();
      offError();
    };
  }, [dispatch, user.role]);
}
