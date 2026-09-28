import { useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { initSocket, disconnectSocket, getSocket } from './socket';

export const useSocket = () => {
  const { isAuthenticated, user } = useAuth();

  const connect = useCallback(() => {
    if (isAuthenticated && user) {
      initSocket();
    }
  }, [isAuthenticated, user]);

  const disconnect = useCallback(() => {
    if (!isAuthenticated) {
      disconnectSocket();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user) {
      initSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      if (!isAuthenticated) {
        disconnectSocket();
      }
    };
  }, [isAuthenticated, user]);

  return {
    socket: getSocket(),
    connect,
    disconnect,
    isConnected: getSocket()?.connected ?? false,
  };
};