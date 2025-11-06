import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useAppTheme } from '../theme';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationBellProps {
  onPress: () => void;
  size?: number;
  iconColor?: string;
}

export default function NotificationBell({ 
  onPress, 
  size = 20, 
  iconColor 
}: NotificationBellProps) {
  const theme = useAppTheme();
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.container}>
      <IconButton
        icon="bell-outline"
        size={size}
        iconColor={iconColor || theme.colors.onSurface}
        onPress={onPress}
        style={styles.iconButton}
      />
      {unreadCount > 0 && (
        <View style={[
          styles.badge,
          { backgroundColor: theme.colors.error }
        ]}>
          <Text style={[styles.badgeText, { color: theme.colors.onError }]}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconButton: {
    margin: 0,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
