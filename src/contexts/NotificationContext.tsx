'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { NotificationPayload } from '@/lib/socket/events';
import { useSocket, useSocketEvent } from '@/lib/socket/client';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: NotificationPayload[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const socket = useSocket();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Listen for new notifications
  useSocketEvent<NotificationPayload>(socket ? 'notification:created' : '', (payload) => {
    setNotifications((prev) => [payload, ...prev]);
    toast.info(payload.title, { description: payload.message });
  });

  // Fetch initial notifications from Firestore
  const fetchNotifications = useCallback(async () => {
    if (!socket) return;
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // Silently fail - local state will be used
    }
  }, [socket]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    fetch('/api/notifications/clear', { method: 'DELETE' }).catch(() => {});
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}