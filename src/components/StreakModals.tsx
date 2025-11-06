import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Portal, Modal, Card, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';
import { StreakState } from '../utils/streakHelpers';

interface StreakWarningModalProps {
  visible: boolean;
  onDismiss: () => void;
  onActionPress: () => void;
  streakDays: number;
}

export function StreakWarningModal({ visible, onDismiss, onActionPress, streakDays }: StreakWarningModalProps) {
  const theme = useAppTheme();

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [visible]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Card style={styles.warningCard}>
          <Card.Content style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="alert-outline" size={48} color="#F59E0B" />
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Sắp mất chuỗi!
              </Text>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Đã 1 ngày bạn chưa hoạt động. Ghi nhanh một giao dịch hoặc xem báo cáo để giữ streak {streakDays} ngày nhé!
            </Text>

            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={onDismiss}
                style={styles.modalButton}
              >
                Để sau
              </Button>
              <Button 
                mode="contained" 
                onPress={onActionPress}
                style={styles.modalButton}
                buttonColor="#F59E0B"
              >
                Ghi chi tiêu ngay
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

interface StreakLostModalProps {
  visible: boolean;
  onDismiss: () => void;
  onRestartPress: () => void;
  lostStreakDays: number;
}

export function StreakLostModal({ visible, onDismiss, onRestartPress, lostStreakDays }: StreakLostModalProps) {
  const theme = useAppTheme();

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [visible]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Card style={styles.lostCard}>
          <Card.Content style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="fire-off" size={48} color="#EF4444" />
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Chuỗi streak đã kết thúc
              </Text>
            </View>
            
            <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Đừng lo, bạn có thể bắt đầu lại hôm nay và dễ dàng lập lại thói quen quản lý chi tiêu! 
              Streak trước đó ({lostStreakDays} ngày) vẫn là kỷ lục của bạn.
            </Text>

            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={onDismiss}
                style={styles.modalButton}
              >
                Đóng
              </Button>
              <Button 
                mode="contained" 
                onPress={onRestartPress}
                style={styles.modalButton}
                buttonColor="#22C55E"
              >
                Bắt đầu lại
              </Button>
            </View>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
}

interface StreakMilestoneModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSharePress?: () => void;
  milestone: number;
}

export function StreakMilestoneModal({ visible, onDismiss, onSharePress, milestone }: StreakMilestoneModalProps) {
  const theme = useAppTheme();
  
  // Animation values - simplified
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Success haptic feedback for milestone
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.8);
      
      // Smooth entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getMilestoneTitle = (days: number) => {
    if (days === 7) return 'Tuần đầu hoàn hảo!';
    if (days === 14) return 'Hai tuần kiên trì!';
    if (days === 30) return 'Một tháng xuất sắc!';
    if (days === 60) return 'Hai tháng tuyệt vời!';
    if (days === 100) return 'Trăm ngày huyền thoại!';
    if (days === 365) return 'Một năm phi thường!';
    return `${days} ngày liên tục!`;
  };

  const getBadgeName = (days: number) => {
    if (days === 7) return 'Khởi Đầu Tốt';
    if (days === 14) return 'Kiên Trì Bền Bỉ';
    if (days === 30) return 'Giữ Lửa Tài Chính';
    if (days === 60) return 'Chuyên Gia Quản Lý';
    if (days === 100) return 'Bậc Thầy Streak';
    if (days === 365) return 'Huyền Thoại Tài Chính';
    return 'Streak Master';
  };

  const getBadgeColor = (days: number) => {
    if (days >= 365) return '#EC4899'; // Pink
    if (days >= 100) return '#8B5CF6'; // Purple
    if (days >= 60) return '#3B82F6'; // Blue
    if (days >= 30) return '#10B981'; // Green
    if (days >= 14) return '#F59E0B'; // Orange
    return '#EAB308'; // Yellow
  };

  const badgeColor = getBadgeColor(milestone);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.fullScreenModal}>
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }}
        >
          <Card style={styles.milestoneCard}>
            <Card.Content style={styles.celebrationContent}>
              
              {/* Icon and title section */}
              <View style={styles.iconSection}>
                <View style={[styles.iconCircle, { backgroundColor: badgeColor + '15' }]}>
                  <MaterialCommunityIcons name="trophy-variant" size={56} color={badgeColor} />
                </View>
              </View>

              {/* Main content */}
              <View style={styles.contentSection}>
                <Text style={[styles.congratsText, { color: theme.colors.onSurface }]}>
                  Chúc mừng!
                </Text>
                
                <View style={[styles.milestoneNumberBox, { backgroundColor: badgeColor + '10' }]}>
                  <MaterialCommunityIcons name="fire" size={28} color={badgeColor} />
                  <Text style={[styles.milestoneNumber, { color: badgeColor }]}>
                    {milestone} ngày
                  </Text>
                </View>

                <Text style={[styles.milestoneTitle, { color: theme.colors.onSurface }]}>
                  {getMilestoneTitle(milestone)}
                </Text>
              </View>

              {/* Badge section */}
              <View style={[styles.badgeSection, { backgroundColor: badgeColor + '08' }]}>
                <View style={[styles.badgeIconCircle, { backgroundColor: badgeColor }]}>
                  <MaterialCommunityIcons name="medal" size={24} color="#FFF" />
                </View>
                <View style={styles.badgeTextContainer}>
                  <Text style={[styles.badgeLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Huy hiệu mới
                  </Text>
                  <Text style={[styles.badgeName, { color: badgeColor }]}>
                    {getBadgeName(milestone)}
                  </Text>
                </View>
              </View>

              {/* Message */}
              <Text style={[styles.messageText, { color: theme.colors.onSurfaceVariant }]}>
                Bạn đã duy trì thói quen quản lý tài chính xuất sắc. Hãy tiếp tục phát huy!
              </Text>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <Button 
                  mode="contained" 
                  onPress={onDismiss}
                  style={[styles.primaryButton, { backgroundColor: badgeColor }]}
                  labelStyle={styles.primaryButtonLabel}
                  contentStyle={styles.buttonContent}
                >
                  Tiếp tục
                </Button>
                {onSharePress && (
                  <Button 
                    mode="text" 
                    onPress={onSharePress}
                    style={styles.textButton}
                    textColor={badgeColor}
                    icon="share-variant"
                  >
                    Chia sẻ thành tích
                  </Button>
                )}
              </View>
              
            </Card.Content>
          </Card>
        </Animated.View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 16,
  },
  fullScreenModal: {
    marginHorizontal: 24,
    marginVertical: 'auto',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  lostCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  milestoneCard: {
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  modalContent: {
    paddingVertical: 24,
  },
  celebrationContent: {
    padding: 24,
    alignItems: 'center',
    gap: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  
  // New simplified design
  iconSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  congratsText: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  milestoneNumberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  milestoneNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  badgeSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  badgeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextContainer: {
    flex: 1,
    gap: 2,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 12,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  textButton: {
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
