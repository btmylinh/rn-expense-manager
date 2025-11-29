import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../theme';
import AppBar from '../../components/AppBar';
import { streakApi } from '../../api/streakApi';
import { getStreakState, StreakState, triggerStreakActivity } from '../../utils/streakHelpers';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../utils/errorHandler';

interface StreakDetailScreenProps {
  navigation: any;
}

interface StatItemProps {
  icon: string;
  label: string;
  value: string;
  color?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color = '#6B7280' }) => {
  const theme = useAppTheme();
  
  return (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
        {value}
      </Text>
    </View>
  );
};

export default function StreakDetailScreen({ navigation }: StreakDetailScreenProps) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const userId = user?.id;
  
  const [streakData, setStreakData] = useState<any>(null);
  const [streakStats, setStreakStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    loadStreakData();
  }, [userId]); // Re-load when user changes

  const loadStreakData = async () => {
    try {
      setLoading(true);
      const [streakResponse, settingsResponse, historyResponse] = await Promise.all([
        streakApi.getStreak(),
        streakApi.getSettings(),
        streakApi.getHistory({ limit: 1000 })
      ]);

      const streak = streakResponse.data?.data;
      const settings = settingsResponse.data?.data;
      const history = historyResponse.data?.data?.history || [];

      if (streak && settings) {
        // Map backend data to frontend format
        const mappedData = {
          streak: {
            id: streak.id,
            userId: streak.user_id,
            streakDays: streak.streak_days,
            lastTransactionDate: streak.last_transaction_date,
            createdAt: streak.created_at,
            updatedAt: streak.updated_at,
          },
          settings: {
            id: settings.id,
            userId: settings.user_id,
            dailyReminderEnabled: settings.daily_reminder_enabled === 1,
            reminderTime: settings.reminder_time,
            weekendMode: settings.weekend_mode === 1,
            bestStreak: settings.best_streak,
            totalActiveDays: settings.total_active_days,
          },
        };

        setStreakData(mappedData);
        formatCalendarData(mappedData, history);

        // Calculate stats
        // Calculate days since registration for completion rate
        const registrationDate = history.length > 0 
          ? new Date(Math.min(...history.map((d: any) => new Date(d.date).getTime())))
          : new Date();
        const daysSinceRegistration = Math.max(1, Math.ceil((new Date().getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)));
        const completionRate = daysSinceRegistration > 0 
          ? Math.round((settings.total_active_days / daysSinceRegistration) * 100) 
          : 0;

        const stats = {
          currentStreak: streak.streak_days,
          bestStreak: settings.best_streak,
          totalActiveDays: settings.total_active_days,
          completionRate: completionRate,
        };
        setStreakStats(stats);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCalendarData = (data: any, history: any[]) => {
    const marked: any = {};
    
    // Get today's date in local timezone to avoid timezone issues
    const nowLocal = new Date();
    const today = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth() + 1).padStart(2, '0')}-${String(nowLocal.getDate()).padStart(2, '0')}`;
    
    const yesterdayDate = new Date(nowLocal);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    if (history && history.length > 0) {
      // Create a map for quick lookup
      const historyMap: any = {};
      history.forEach((day: any) => {
        const dateStr = day.date.split('T')[0]; // Extract date part from ISO string
        historyMap[dateStr] = {
          hasActivity: day.has_activity === 1,
          activityType: day.activity_type
        };
      });
      
      // Get the registration date (earliest date in history)
      const registrationDate = history.length > 0 
        ? new Date(Math.min(...history.map((d: any) => new Date(d.date).getTime())))
        : new Date();
      
      // Generate all dates from registration to today
      const todayDate = new Date(today + 'T00:00:00');
      const currentDate = new Date(registrationDate);
      currentDate.setHours(0, 0, 0, 0);
      
      while (currentDate <= todayDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const dayInfo = historyMap[dateStr];
        const hasActivity = dayInfo?.hasActivity || false;
        const isToday = dateStr === today;
        const isYesterday = dateStr === yesterday;

        if (isToday) {
          if (hasActivity) {
              // Hôm nay đã hoạt động
              marked[dateStr] = {
                customStyles: {
                  container: {
                    backgroundColor: '#FF8A00',
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#FFB74D',
                  },
                  text: {
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                  },
                },
              };
          } else {
            // Hôm nay chưa hoạt động
            marked[dateStr] = {
              customStyles: {
                container: {
                  backgroundColor: '#FFFDE7',
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: '#FF8A00',
                },
                text: {
                  color: '#FF8A00',
                  fontWeight: 'bold',
                },
              },
            };
          }
        } else if (hasActivity) {
            // Ngày đã hoạt động (quá khứ)
            marked[dateStr] = {
              customStyles: {
                container: {
                  backgroundColor: '#FF8A00',
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: '#FFB74D',
                },
                text: {
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                },
              },
            };
        } else {
          // Check if it's a warning day (yesterday without activity but had activity day before)
          const dayBeforeDate = new Date(currentDate);
          dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
          const dayBeforeStr = dayBeforeDate.toISOString().split('T')[0];
          const hadActivityBefore = historyMap[dayBeforeStr]?.hasActivity;
          
          if (isYesterday && hadActivityBefore) {
            // Nghỉ 1 ngày - cảnh báo (màu đỏ)
            marked[dateStr] = {
              customStyles: {
                container: {
                  backgroundColor: '#FFEBEE',
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: '#EF5350',
                },
                text: {
                  color: '#EF5350',
                  fontWeight: 'bold',
                },
              },
            };
          } else {
            // Bỏ lỡ (ngắt chuỗi)
            marked[dateStr] = {
              customStyles: {
                container: {
                  backgroundColor: '#E0E0E0',
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#BDBDBD',
                },
                text: {
                  color: '#9E9E9E',
                  fontWeight: 'normal',
                },
              },
            };
          }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    setMarkedDates(marked);
  };

  const handleManualCheckIn = async () => {
    // Get current streak status
    const streakStatus = getStreakState(streakData);
    
    // Check if already completed today
    if (streakStatus.todayCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        'Đã hoàn thành', 
        'Bạn đã có hoạt động hôm nay rồi!',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await triggerStreakActivity('manual_checkin');
        Alert.alert(
          'Thành công!', 
          'Đã ghi nhận check-in hôm nay!',
          [{ text: 'OK', onPress: () => loadStreakData() }]
        );
    } catch (error: any) {
      Alert.alert('Lỗi', getErrorMessage(error, 'Có lỗi xảy ra. Vui lòng thử lại.'));
      console.error('Failed to check in:', error);
    }
  };

  if (loading || !streakData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppBar title="Streak của bạn" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const streakStatus = getStreakState(streakData);
  // Support both camelCase and snake_case
  const currentStreak = streakData.streak?.streak_days || streakData.streak?.streakDays || 0;
  const bestStreak = streakData.settings?.best_streak || streakData.settings?.bestStreak || 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBar title="Streak của bạn" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <Card style={[styles.heroCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.heroContent}>
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons 
                name={streakStatus.state === StreakState.LOST ? "fire-off" : "fire"} 
                size={64} 
                color={streakStatus.state === StreakState.LOST ? "#EF4444" : "#FF6B35"} 
              />
              <Text style={[styles.heroStreakNumber, { color: theme.colors.onSurface }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.heroStreakText, { color: theme.colors.onSurfaceVariant }]}>
                ngày liên tiếp
              </Text>
            </View>
            
            <Text style={[styles.motivationText, { color: theme.colors.onSurfaceVariant }]}>
              {streakStatus.state === StreakState.NEW_START && 'Hành trình mới bắt đầu! Hãy duy trì thói quen mỗi ngày.'}
              {streakStatus.state === StreakState.MAINTAINING && `Tuyệt vời! Bạn đang duy trì streak ${currentStreak} ngày.`}
              {streakStatus.state === StreakState.WARNING && 'Cẩn thận! Hãy hoạt động hôm nay để giữ streak.'}
              {streakStatus.state === StreakState.LOST && 'Đừng lo! Bạn có thể bắt đầu lại và phá vỡ kỷ lục cũ.'}
              {streakStatus.state === StreakState.MILESTONE && 'Chúc mừng! Bạn đã đạt được mốc quan trọng.'}
            </Text>

            {/* Progress bar for new users */}
            {streakStatus.state === StreakState.NEW_START && (
              <View style={styles.progressContainer}>
                <ProgressBar 
                  progress={Math.min(currentStreak / 7, 1)} 
                  color={theme.colors.primary} 
                  style={styles.progressBar}
                />
                <Text style={[styles.progressLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {currentStreak}/7 ngày đầu tiên
                </Text>
              </View>
            )}

            {/* Action buttons */}
            {!streakStatus.todayCompleted && (
              <Button 
                mode="contained" 
                onPress={handleManualCheckIn}
                style={styles.checkInButton}
                icon="check-circle"
              >
                Check-in ngay
              </Button>
            )}

          </Card.Content>
        </Card>

        {/* Stats Section */}
        {streakStats && (
          <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Thống kê
              </Text>
              <View style={styles.statsGrid}>
                <StatItem 
                  icon="trophy" 
                  label="Streak cao nhất" 
                  value={`${bestStreak} ngày`}
                  color="#FFD700"
                />
                <StatItem 
                  icon="calendar-check" 
                  label="Tổng ngày active" 
                  value={`${streakStats.totalActiveDays} ngày`}
                  color="#22C55E"
                />
                <StatItem 
                  icon="percent" 
                  label="Tỷ lệ hoàn thành" 
                  value={`${streakStats.completionRate}%`}
                  color="#3B82F6"
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Calendar View - Full Timeline */}
        <Card style={[styles.calendarCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Lịch sử hoạt động
            </Text>
            <Text style={[styles.calendarSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Toàn bộ dòng thời gian kể từ khi đăng ký
            </Text>
            
            <Calendar
              current={new Date().toISOString().split('T')[0]}
              markedDates={markedDates}
              markingType={'custom'}
              onDayPress={(day) => {
                console.log('Selected day:', day);
              }}
              theme={{
                backgroundColor: theme.colors.surface,
                calendarBackground: theme.colors.surface,
                textSectionTitleColor: theme.colors.onSurfaceVariant,
                selectedDayBackgroundColor: 'transparent',
                selectedDayTextColor: theme.colors.onSurface,
                todayTextColor: '#FF8A00',
                dayTextColor: theme.colors.onSurface,
                textDisabledColor: '#E0E0E0',
                dotColor: theme.colors.primary,
                selectedDotColor: theme.colors.onPrimary,
                arrowColor: '#FF8A00',
                monthTextColor: theme.colors.onSurface,
                indicatorColor: theme.colors.primary,
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13
              }}
              style={styles.calendarComponent}
            />

            {/* Chú thích trạng thái */}
            <View style={styles.legendContainer}>
              <Text style={[styles.legendTitle, { color: theme.colors.onSurface }]}>Chú thích:</Text>
              <View style={styles.legendGrid}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendCircle, { backgroundColor: '#FF8A00', borderColor: '#FFB74D' }]} />
                  <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
                    Có hoạt động
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendCircle, { backgroundColor: '#FFFDE7', borderColor: '#FF8A00' }]} />
                  <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
                    Hôm nay (chưa hoạt động)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendCircle, { backgroundColor: '#FFEBEE', borderColor: '#EF5350' }]} />
                  <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
                    Cảnh báo (nghỉ 1 ngày)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendCircle, { backgroundColor: '#E0E0E0', borderColor: '#BDBDBD' }]} />
                  <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>
                    Bỏ lỡ (ngắt chuỗi)
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Milestone Achievements */}
        {streakStatus.state === StreakState.MILESTONE && (
          <Card style={[styles.achievementCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.achievementHeader}>
                <MaterialCommunityIcons name="medal-outline" size={32} color="#FFD700" />
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Thành tích mới mở khóa!
                </Text>
              </View>
              
              <View style={styles.achievementBadge}>
                <Text style={[styles.achievementTitle, { color: '#FFD700' }]}>
                  Huy hiệu đạt mốc {streakStatus.milestone} ngày
                </Text>
                <Text style={[styles.achievementDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {getAchievementDescription(streakStatus.milestone || 0)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const getActivityIcon = (activityType: string): string => {
  switch (activityType) {
    case 'transaction': return 'cash';
    case 'budget_check': return 'wallet';
    case 'dashboard_view': return 'view-dashboard';
    case 'manual_checkin': return 'check-circle';
    default: return 'circle';
  }
};

const getAchievementDescription = (milestone: number): string => {
  switch (milestone) {
    case 7: return 'Tuần đầu tiên hoàn hảo! Bạn đã xây dựng nền tảng vững chắc.';
    case 14: return 'Hai tuần kiên trì! Thói quen đã bắt đầu hình thành.';
    case 30: return 'Một tháng xuất sắc! Bạn đã chứng minh sự cam kết.';
    case 60: return 'Hai tháng tuyệt vời! Quản lý tài chính đã trở thành thói quen.';
    case 100: return 'Trăm ngày huyền thoại! Bạn là chuyên gia thực thụ.';
    case 365: return 'Một năm phi thường! Bạn là nguồn cảm hứng cho mọi người.';
    default: return 'Thành tích đáng nể! Hãy tiếp tục duy trì.';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    margin: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroContent: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  streakBadge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroStreakNumber: {
    fontSize: 48,
    fontWeight: '700',
    marginTop: 8,
  },
  heroStreakText: {
    fontSize: 16,
    marginTop: 4,
  },
  motivationText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressLabel: {
    textAlign: 'center',
    fontSize: 14,
  },
  checkInButton: {
    marginBottom: 12,
  },
  statsCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  calendarCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
  },
  calendarSubtitle: {
    fontSize: 13,
    marginTop: -8,
    marginBottom: 16,
  },
  calendarComponent: {
    borderRadius: 12,
    marginBottom: 16,
  },
  legendContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
    minWidth: '45%',
  },
  legendCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    flex: 1,
  },
  achievementCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementBadge: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFD700' + '10',
    borderRadius: 12,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
