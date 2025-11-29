import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './AuthContext';

export interface Notification {
  id: number;
  userId: number;
  type?: NotificationType;
  title?: string;
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
  const { user } = useAuth();
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
      await notificationApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const payload: any = {};
      if (newSettings.budgetAlerts !== undefined) payload.budget_alerts = newSettings.budgetAlerts ? 1 : 0;
      if (newSettings.transactionReminders !== undefined) payload.transaction_reminders = newSettings.transactionReminders ? 1 : 0;
      if (newSettings.weeklyReports !== undefined) payload.weekly_reports = newSettings.weeklyReports ? 1 : 0;
      if (newSettings.securityAlerts !== undefined) payload.security_alerts = newSettings.securityAlerts ? 1 : 0;
      if (newSettings.pushEnabled !== undefined) payload.push_enabled = newSettings.pushEnabled ? 1 : 0;
      if (newSettings.quietHours) {
        payload.quiet_hours_enabled = newSettings.quietHours.enabled ? 1 : 0;
        if (newSettings.quietHours.startTime) payload.quiet_hours_start = newSettings.quietHours.startTime;
        if (newSettings.quietHours.endTime) payload.quiet_hours_end = newSettings.quietHours.endTime;
      }

      const response = await notificationApi.updateSettings(payload);
      const updatedSettings = response.data?.data;
      if (updatedSettings) {
        setSettings({
          budgetAlerts: updatedSettings.budget_alerts === 1,
          transactionReminders: updatedSettings.transaction_reminders === 1,
          weeklyReports: updatedSettings.weekly_reports === 1,
          securityAlerts: updatedSettings.security_alerts === 1,
          pushEnabled: updatedSettings.push_enabled === 1,
          quietHours: {
            enabled: updatedSettings.quiet_hours_enabled === 1,
            startTime: updatedSettings.quiet_hours_start || '22:00',
            endTime: updatedSettings.quiet_hours_end || '08:00',
          },
        });
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const refreshNotifications = async () => {
    try {
      const response = await notificationApi.getNotifications({ limit: 1000 });
      const notificationsData = response.data?.data?.notifications || [];
      
      // Map backend fields to frontend format
      const mappedNotifications = notificationsData.map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        isRead: n.status === 'read',
        createdAt: n.created_at,
        scheduledFor: n.scheduled_for,
      }));
      
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await notificationApi.getSettings();
      const settingsData = response.data?.data;
      if (settingsData) {
        setSettings({
          budgetAlerts: settingsData.budget_alerts === 1,
          transactionReminders: settingsData.transaction_reminders === 1,
          weeklyReports: settingsData.weekly_reports === 1,
          securityAlerts: settingsData.security_alerts === 1,
          pushEnabled: settingsData.push_enabled === 1,
          quietHours: {
            enabled: settingsData.quiet_hours_enabled === 1,
            startTime: settingsData.quiet_hours_start || '22:00',
            endTime: settingsData.quiet_hours_end || '08:00',
          },
        });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  // Load notifications and settings from API on mount
  useEffect(() => {
    if (user) {
      refreshNotifications();
      loadSettings();
    }
  }, [user]);

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
