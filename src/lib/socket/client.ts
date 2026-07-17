'use client';

import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

let socket: Socket | null = null;
let connectionPromise: Promise<Socket> | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    socket = io(serverUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectionPromise = null;
  }
}

export function useSocket(): Socket | null {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const { user } = useAuth();
  const isRegistered = useRef(false);

  useEffect(() => {
    const sock = getSocket();
    setSocketInstance(sock);

    // Register user when connected and auth is ready
    const register = () => {
      if (sock.connected && user && user.role) {
        // We only register if role is available, and we avoid re-registering if we already did with the same role
        if (!isRegistered.current || (sock as any)._lastRegisteredRole !== user.role) {
          sock.emit('register', {
            userId: user.uid,
            role: user.role,
            name: user.displayName || 'Unknown',
          });
          isRegistered.current = true;
          (sock as any)._lastRegisteredRole = user.role;
        }
      }
    };

    sock.on('connect', register);
    if (sock.connected) register();

    return () => {
      sock.off('connect', register);
    };
  }, [user]);

  return socketInstance;
}

export function useSocketEvent<T>(event: string, callback: (data: T) => void): void {
  const socket = useSocket();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!socket) return;

    const handler = (data: T) => callbackRef.current(data);
    socket.on(event, handler);

    return () => { socket.off(event, handler); };
  }, [socket, event]);
}