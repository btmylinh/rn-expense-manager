import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fakeApi } from '../services/fakeApi';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  scheduledFor?: string;
}

export enum NotificationType {
  BUDGET_EXCEEDED = 'budget_exceeded',
  BUDGET_WARNING = 'budget_warning',
  LARGE_TRANSACTION = 'large_transaction',
  TRANSACTION_REMINDER = 'transaction_reminder',
  WEEKLY_REPORT = 'weekly_report',
  GOAL_ACHIEVED = 'goal_achieved',
  SYNC_COMPLETE = 'sync_complete',
  SECURITY_ALERT = 'security_alert'
}

export interface NotificationSettings {
  budgetAlerts: boolean;
  transactionReminders: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  pushEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: number) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    budgetAlerts: true,
    transactionReminders: true,
    weeklyReports: true,
    securityAlerts: true,
    pushEnabled: true,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const userId = 1; // Demo user ID
      const result = await fakeApi.markNotificationAsRead(userId, notificationId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = 1; // Demo user ID
      const result = await fakeApi.markAllNotificationsAsRead(userId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const userId = 1; // Demo user ID
      const result = await fakeApi.deleteNotification(userId, notificationId);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const refreshNotifications = async () => {
    try {
      const userId = 1; // Demo user ID
      const result = await fakeApi.getNotifications(userId);
      if (result.success) {
        setNotifications(result.data.notifications);
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  // Load notifications from API on mount
  useEffect(() => {
    refreshNotifications();
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateSettings,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
