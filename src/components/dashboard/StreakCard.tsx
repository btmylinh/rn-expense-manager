import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { StreakState, StreakStatus, getStreakMessage } from '../../utils/streakHelpers';

interface StreakCardProps {
  streakStatus: StreakStatus | null;
  onPress?: () => void;
  onActionPress?: () => void;
  loading?: boolean;
}

export default function StreakCard({ streakStatus, onPress, onActionPress, loading }: StreakCardProps) {
  const theme = useAppTheme();

  // Loading state
  if (loading || !streakStatus) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Đang tải streak...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  const message = getStreakMessage(streakStatus);

  const getCardStyle = () => {
    const baseStyle = [styles.card, { backgroundColor: theme.colors.surface }];
    
    switch (streakStatus.state) {
      case StreakState.WARNING:
        return [...baseStyle, styles.warningCard];
      case StreakState.LOST:
        return [...baseStyle, styles.lostCard];
      case StreakState.MILESTONE:
        return [...baseStyle, styles.milestoneCard];
      default:
        return baseStyle;
    }
  };

  const renderProgressBar = () => {
    if (streakStatus.state === StreakState.NEW_START) {
      return (
        <View style={styles.progressContainer}>
          <ProgressBar 
            progress={0.14} 
            color={theme.colors.primary} 
            style={styles.progressBar}
          />
          <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
            Ngày đầu tiên khởi động! Hãy mở app mỗi ngày để duy trì chuỗi.
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderActionButton = () => {
    if (streakStatus.state === StreakState.WARNING || streakStatus.state === StreakState.LOST) {
      return (
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: message.color + '20' }]}
          onPress={onActionPress}
        >
          <Text style={[styles.actionButtonText, { color: message.color }]}>
            {streakStatus.state === StreakState.WARNING ? 'Ghi chi tiêu ngay' : 'Bắt đầu lại'}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderMilestoneEffect = () => {
    if (streakStatus.state === StreakState.MILESTONE) {
      return (
        <View style={styles.milestoneEffect}>
          <MaterialCommunityIcons name="medal-outline" size={26} color="#FFD700" />
          <Text style={[styles.milestoneText, { color: '#FFD700' }]}>
            Huy hiệu đạt mốc {streakStatus.milestone} ngày
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Card style={getCardStyle()}>
        <Card.Content style={styles.content}>
          {/* Header with streak count */}
          <View style={styles.header}>
            <View style={styles.leftSection}>
              <View style={[styles.iconContainer, { backgroundColor: message.color + '15' }]}>
              <MaterialCommunityIcons 
                name={message.icon as any} 
                  size={28} 
                color={message.color} 
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {message.title}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                {message.subtitle}
              </Text>
            </View>
          </View>

            {/* Streak counter badge */}
            {streakStatus.streakDays > 0 && (
              <View style={[styles.streakBadge, { backgroundColor: message.color + '15' }]}>
                <MaterialCommunityIcons name="fire" size={20} color={message.color} />
                <Text style={[styles.streakCount, { color: message.color }]}>
                  {streakStatus.streakDays}
                </Text>
              </View>
            )}
          </View>

          {/* Progress bar for new start */}
          {renderProgressBar()}

          {/* Milestone badge */}
          {renderMilestoneEffect()}

          {/* Mini Calendar - Redesigned */}
          {streakStatus.state === StreakState.MAINTAINING && (
            <View style={styles.miniCalendar}>
              <View style={styles.calendarHeader}>
                <MaterialCommunityIcons 
                  name="calendar-check" 
                  size={16} 
                  color={theme.colors.onSurfaceVariant} 
                />
              <Text style={[styles.calendarTitle, { color: theme.colors.onSurfaceVariant }]}>
                  Hoạt động 7 ngày gần đây
              </Text>
              </View>
              <View style={styles.calendarDots}>
                {Array.from({ length: 7 }, (_, index) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - index));
                  const dayNumber = date.getDate();
                  const isActive = index < 5; // Mock: 5/7 active
                  const isToday = index === 6;
                  
                  return (
                    <View key={index} style={styles.calendarDotWrapper}>
                    <View 
                      style={[
                        styles.calendarDot,
                          isActive && !isToday && styles.calendarDotActive,
                          isToday && styles.calendarDotToday,
                      ]}
                    >
                        {isActive && (
                          <MaterialCommunityIcons 
                            name="check" 
                            size={14} 
                            color={isToday ? '#EF4444' : '#10B981'} 
                          />
                        )}
                      </View>
                      <Text style={[
                        styles.calendarDayText,
                        { color: theme.colors.onSurfaceVariant }
                      ]}>
                        {dayNumber}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action button */}
          {renderActionButton()}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
    borderWidth: 2,
    borderColor: '#EAB308',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  milestoneEffect: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 14,
    backgroundColor: '#EAB308' + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAB308' + '30',
  },
  milestoneText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  miniCalendar: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  calendarTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  calendarDotWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  calendarDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDotActive: {
    backgroundColor: '#10B981' + '20',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  calendarDotToday: {
    backgroundColor: '#EF4444' + '20',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  calendarDayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
