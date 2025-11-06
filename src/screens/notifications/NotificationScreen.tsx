import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, Button, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import AppBar from '../../components/AppBar';
import { useNotifications, Notification, NotificationType } from '../../contexts/NotificationContext';

interface NotificationScreenProps {
  navigation: any;
}

export default function NotificationScreen({ navigation }: NotificationScreenProps) {
  const theme = useAppTheme();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const getIconForType = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.BUDGET_EXCEEDED:
      case NotificationType.BUDGET_WARNING:
        return 'cash-multiple';
      case NotificationType.LARGE_TRANSACTION:
        return 'credit-card-outline';
      case NotificationType.TRANSACTION_REMINDER:
        return 'bell-ring';
      case NotificationType.WEEKLY_REPORT:
        return 'chart-line';
      case NotificationType.GOAL_ACHIEVED:
        return 'trophy';
      case NotificationType.SYNC_COMPLETE:
        return 'sync';
      case NotificationType.SECURITY_ALERT:
        return 'shield-alert';
      default:
        return 'bell';
    }
  };

  const getColorForType = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.BUDGET_EXCEEDED:
      case NotificationType.SECURITY_ALERT:
        return '#EF4444';
      case NotificationType.BUDGET_WARNING:
        return '#F59E0B';
      case NotificationType.LARGE_TRANSACTION:
        return '#8B5CF6';
      case NotificationType.GOAL_ACHIEVED:
        return '#10B981';
      case NotificationType.WEEKLY_REPORT:
        return '#3B82F6';
      default:
        return theme.colors.primary;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.BUDGET_EXCEEDED:
      case NotificationType.BUDGET_WARNING:
        navigation.navigate('Tabs', { initialTab: 'Ngân sách' });
        break;
      case NotificationType.LARGE_TRANSACTION:
        navigation.navigate('Tabs', { initialTab: 'Sổ giao dịch' });
        break;
      case NotificationType.WEEKLY_REPORT:
        navigation.navigate('Tabs', { initialTab: 'Tổng quan' });
        break;
      default:
        navigation.goBack();
        break;
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)}>
      <Card style={[
        styles.notificationCard,
        !item.isRead && styles.unreadCard
      ]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.leftSection}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: getColorForType(item.type) + '20' }
              ]}>
                <MaterialCommunityIcons
                  name={getIconForType(item.type) as any}
                  size={20}
                  color={getColorForType(item.type)}
                />
              </View>
              <View style={styles.contentSection}>
                <Text style={[
                  styles.title,
                  !item.isRead && styles.unreadTitle
                ]}>
                  {item.title}
                </Text>
                <Text style={styles.message} numberOfLines={2}>
                  {item.message}
                </Text>
                <Text style={styles.time}>
                  {formatTimeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
            <View style={styles.rightSection}>
              {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: theme.colors.primary }]} />
              )}
              <IconButton
                icon="delete-outline"
                size={18}
                iconColor="#6B7280"
                onPress={() => deleteNotification(item.id)}
                style={styles.deleteButton}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBar
        title="Thông báo"
        onBack={() => navigation.goBack()}
        rightIcons={unreadCount > 0 ? [
          {
            name: 'check-all',
            onPress: markAllAsRead,
          }
        ] : []}
      />

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="bell-outline"
            size={64}
            color="#9CA3AF"
          />
          <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
          <Text style={styles.emptyMessage}>
            Các thông báo về ngân sách, giao dịch và báo cáo sẽ xuất hiện ở đây
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    marginBottom: 12,
    elevation: 1,
    borderRadius: 12,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  cardContent: {
    paddingVertical: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentSection: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#111827',
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  rightSection: {
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  deleteButton: {
    margin: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
