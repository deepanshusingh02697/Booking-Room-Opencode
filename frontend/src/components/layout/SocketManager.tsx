import { useSocket } from '../../realtime/useSocket';
import { useNotifications } from '../../realtime/useNotifications';

export const SocketManager = () => {
  useSocket();
  useNotifications();

  return null;
};