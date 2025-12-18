import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Button, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useAppTheme, getIconColor } from '../../theme';
import { formatCurrency } from '../../utils/format';
import { transactionApi } from '../../api/transactionApi';
import { walletApi } from '../../api/walletApi';
import { userCategoryApi } from '../../api/userCategoryApi';
import { streakApi } from '../../api/streakApi';
import { dashboardApi } from '../../api/dashboardApi';
import AppBar from '../../components/AppBar';
import NotificationBell from '../../components/NotificationBell';
import StreakCard from '../../components/dashboard/StreakCard';
import { StreakWarningModal, StreakLostModal, StreakMilestoneModal } from '../../components/StreakModals';
import { getStreakState, StreakState } from '../../utils/streakHelpers';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecurringExpensesWidget from '../../components/dashboard/RecurringExpensesWidget';
import SummaryWidget from '../../components/dashboard/SummaryWidget';
import ExpenseChartWidget from '../../components/dashboard/ExpenseChartWidget';
import CategoryChartWidget from '../../components/dashboard/CategoryChartWidget';
import TopCategoriesWidget from '../../components/dashboard/TopCategoriesWidget';
import RecentTransactionsWidget from '../../components/dashboard/RecentTransactionsWidget';
import { useRecurringExpenseReminders } from '../../hooks/useRecurringExpenseReminders';

const SCREEN_WIDTH = Dimensions.get('window').width;

type StreakCardState = 'loading' | 'ready' | 'empty' | 'error';

interface CategorySpending {
  category: {
    id: number;
    name: string;
    icon?: string;
  };
  amount: number;
}

export default function DashboardScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const insets = useSafeAreaInsets();
  
  // Animation for AI Assistant FAB
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // State
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [previousStats, setPreviousStats] = useState<any>(null);
  const [topCategories, setTopCategories] = useState<CategorySpending[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const defaultStreakPayload = {
    streak: {
      streakDays: 0,
      lastTransactionDate: null,
    },
    settings: {
      bestStreak: 0,
      totalActiveDays: 0,
    },
    todayCompleted: false,
  };
  const [streakData, setStreakData] = useState<any>(defaultStreakPayload);
  const [streakLoading, setStreakLoading] = useState(true);
  const [streakCardState, setStreakCardState] = useState<StreakCardState>('loading');
  const [streakErrorMessage, setStreakErrorMessage] = useState<string | null>(null);
  const [recentHistory, setRecentHistory] = useState<Array<{ date: string; has_activity: number }>>([]);
  
  // Streak modal states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  
  // Track if milestone modal was already shown for current milestone
  const shownMilestonesRef = useRef<Set<number>>(new Set());

  // Recurring expense reminders hook
  const { reminders } = useRecurringExpenseReminders();
  // Trong ngày tới hạn (daysUntilDue = 0) gọi là "tới hạn" (upcoming), không phải "quá hạn"
  // Quá hạn chỉ khi daysUntilDue < 0 (đã qua ngày tới hạn)
  const upcomingRemindersCount = reminders.filter(r => r.daysUntilDue >= 0).length;
  const overdueCount = reminders.filter(r => r.daysUntilDue < 0).length;

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, [timeRange, userId]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      
      // TODO: Tech debt - Weekly report generation, streak warnings, reminders
      // These features require backend endpoints that don't exist yet
    }, [timeRange, userId])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setStreakLoading(true);
      setStreakCardState('loading');
      setStreakErrorMessage(null);
      setShowWarningModal(false);
      setShowLostModal(false);
      setShowMilestoneModal(false);

      // Fetch dashboard stats from API (backend calculates everything)
      const [dashboardResponse, streakResponse] = await Promise.all([
        dashboardApi.getStats(timeRange),
        streakApi.getStreak(),
      ]);

      const dashboardData = dashboardResponse.data?.data;
      if (!dashboardData) {
        console.error('No dashboard data received');
        return;
      }

      // Set summary stats
      setCurrentStats({ 
        income: dashboardData.summary.income, 
        expense: dashboardData.summary.expense 
      });
      setPreviousStats({ 
        income: dashboardData.summary.income - (dashboardData.summary.incomeChange * dashboardData.summary.income / 100), 
        expense: dashboardData.summary.expense - (dashboardData.summary.expenseChange * dashboardData.summary.expense / 100)
      });
      setChangesData({ 
        income: dashboardData.summary.incomeChange, 
        expense: dashboardData.summary.expenseChange 
      });

      // Set chart data (add labelTextStyle for bar chart)
      const barDataWithStyles = dashboardData.barChart.map((item) => ({
        ...item,
        labelTextStyle: { 
          color: theme.colors.onSurface, 
          fontSize: item.labelWidth === 80 ? 14 : 14, 
          fontWeight: 'bold' as const 
        },
      }));
      setBarChartData(barDataWithStyles);

      // Set pie chart data (use frontend color mapping)
      const pieData = dashboardData.pieChart.map((item) => ({
        ...item,
        color: getIconColor(item.category.icon || undefined, theme),
        text: formatCurrency(item.value),
      }));
      setPieChartData(pieData);

      // Set top categories (convert null to undefined for icon)
      setTopCategories(dashboardData.topCategories.map((cat) => ({
        ...cat,
          category: {
          ...cat.category,
          icon: cat.category.icon || undefined,
        },
      })));

      // Set recent transactions
      setRecentTransactions(dashboardData.recentTransactions);

      // Set date range label
      setDateRangeLabel(dashboardData.dateRange.label);

      // Load streak data
      if (streakResponse.data?.data) {
        const streakData = streakResponse.data.data;
        const settingsResponse = await streakApi.getSettings();
        const settings = settingsResponse.data?.data;
        const historyResponse = await streakApi.getHistory({ limit: 1000 });
        const history = historyResponse.data?.data?.history || [];

        const today = new Date().toISOString().split('T')[0];
        const todayHistory = history.find((h: any) => h.date.startsWith(today));
        
        // Calculate 7 recent days history
        const recent7Days: Array<{ date: string; has_activity: number }> = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const historyEntry = history.find((h: any) => {
            const historyDate = new Date(h.date).toISOString().split('T')[0];
            return historyDate === dateStr;
          });
          recent7Days.push({
            date: dateStr,
            has_activity: historyEntry?.has_activity || 0,
          });
        }
        setRecentHistory(recent7Days);
        
        let newStreakData = {
          streak: {
            streakDays: streakData.streak_days || 0,
            lastTransactionDate: streakData.last_transaction_date,
          },
          settings: {
            bestStreak: settings?.best_streak || 0,
            totalActiveDays: settings?.total_active_days || 0,
          },
          todayCompleted: todayHistory?.has_activity === 1,
        };

        let streakStatus = getStreakState(newStreakData);
        const STORAGE_KEY = `milestone_shown_${userId}_${streakStatus.milestone}`;
        
        if (streakStatus.state === StreakState.WARNING && !showWarningModal) {
          setShowWarningModal(true);
        } else if (streakStatus.state === StreakState.LOST && !showLostModal) {
          setShowLostModal(true);
        } else if (streakStatus.state === StreakState.MILESTONE && !showMilestoneModal) {
          const milestoneNum = streakStatus.milestone || 0;
          if (!shownMilestonesRef.current.has(milestoneNum)) {
            AsyncStorage.getItem(STORAGE_KEY).then((value) => {
              const todayStr = new Date().toDateString();
              if (value !== todayStr) {
                shownMilestonesRef.current.add(milestoneNum);
                setShowMilestoneModal(true);
                AsyncStorage.setItem(STORAGE_KEY, todayStr);
              }
            });
          }
        }
        // Trigger tự động xử lý streak khi có transaction, không cần gọi API activate
        setStreakData(newStreakData);
        setStreakCardState(streakStatus.isNewUser ? 'empty' : 'ready');
        setStreakLoading(false);
      } else {
        setStreakData(defaultStreakPayload);
        setStreakCardState('empty');
        setStreakLoading(false);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (streakCardState !== 'ready') {
        setStreakCardState('error');
        setStreakErrorMessage('Không thể tải dữ liệu streak. Vui lòng thử lại sau.');
      }
      setStreakLoading(false);
    } finally {
      setLoading(false);
    }
  };


  const [dateRangeLabel, setDateRangeLabel] = useState<string>('');

  const formatDateRange = () => {
    return dateRangeLabel || (timeRange === 'week' ? 'Tuần này' : `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
  };

  // State for changes data
  const [changesData, setChangesData] = useState<{income: number, expense: number}>({income: 0, expense: 0});

  // Shake animation effect
  useEffect(() => {
    const startShakeAnimation = () => {
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Repeat after 3 seconds
        setTimeout(startShakeAnimation, 3000);
      });
    };

    // Start animation after initial delay
    const timer = setTimeout(startShakeAnimation, 2000);
    return () => clearTimeout(timer);
  }, [shakeAnimation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBar 
        title={`Tổng quan`} 
        align="center"
        rightIcons={[
          {
            name: 'bell-outline',
            onPress: () => navigation.navigate('Notifications'),
          },
        ]}
      />
      {/* Badge cảnh báo chi tiêu định kỳ sắp đến hạn - Dẫn đến trang Notifications */}
      {(upcomingRemindersCount > 0 || overdueCount > 0) && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={[styles.reminderBanner, { 
            backgroundColor: overdueCount > 0 ? theme.colors.errorContainer : theme.colors.primaryContainer,
            marginHorizontal: 16,
            marginTop: 8,
          }]}
        >
          <MaterialCommunityIcons
            name={overdueCount > 0 ? 'alert-circle' : 'bell-ring'}
            size={20}
            color={overdueCount > 0 ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.reminderBannerText, { 
            color: overdueCount > 0 ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer 
          }]}>
            {overdueCount > 0 
              ? `${overdueCount} chi tiêu định kỳ quá hạn`
              : upcomingRemindersCount > 0
              ? `${upcomingRemindersCount} chi tiêu định kỳ ${reminders.some(r => r.daysUntilDue === 0 && r.expense.frequency === 'daily') ? 'cần thanh toán hôm nay' : 'sắp đến hạn'}`
              : ''}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={overdueCount > 0 ? theme.colors.onErrorContainer : theme.colors.onPrimaryContainer}
          />
        </TouchableOpacity>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streak Section */}
        {(() => {
          if (streakCardState === 'error') {
            return (
              <Card style={[styles.card, { backgroundColor: theme.colors.surface, marginHorizontal: 16, marginBottom: 16 }]}>
                <Card.Content style={{ paddingVertical: 24 }}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={32}
                    color={theme.colors.error}
                    style={{ marginBottom: 12, alignSelf: 'center' }}
                  />
                  <Text style={{ color: theme.colors.onSurface, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                    Không thể tải dữ liệu streak
                  </Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                    {streakErrorMessage || 'Vui lòng kiểm tra kết nối và thử lại sau.'}
                  </Text>
                  <Button
                    mode="contained-tonal"
                    style={{ marginTop: 16 }}
                    onPress={loadDashboardData}
                  >
                    Thử lại
                  </Button>
                </Card.Content>
              </Card>
            );
          }

          if (streakCardState === 'empty') {
            return (
              <Card style={[styles.card, { backgroundColor: theme.colors.surface, marginHorizontal: 16, marginBottom: 16 }]}>
                <Card.Content style={{ paddingVertical: 24 }}>
                  <MaterialCommunityIcons
                    name="fire-off"
                    size={32}
                    color={theme.colors.onSurfaceVariant}
                    style={{ marginBottom: 12, alignSelf: 'center' }}
                  />
                  <Text style={{ color: theme.colors.onSurface, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                    Chưa có streak nào
                  </Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                    Bắt đầu ghi lại chi tiêu mỗi ngày để tạo streak đầu tiên của bạn.
                  </Text>
                  <Button
                    mode="contained"
                    style={{ marginTop: 16 }}
                    onPress={() => navigation.navigate('Thêm')}
                  >
                    Ghi giao dịch đầu tiên
                  </Button>
                </Card.Content>
              </Card>
            );
          }

          const streakStatus = getStreakState(streakData);
          return (
          <StreakCard 
            key={`streak-${userId}`}
              streakStatus={streakStatus}
              loading={streakLoading || streakCardState === 'loading'}
              recentHistory={recentHistory}
            onPress={() => {
              navigation.navigate('StreakDetail');
            }}
            onActionPress={() => {
                if (streakStatus.state === StreakState.WARNING || streakStatus.state === StreakState.LOST) {
                navigation.navigate('Thêm');
              }
            }}
          />
          );
        })()}

        {/* Recurring Expenses Widget */}
        <RecurringExpensesWidget />

        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          <TouchableOpacity
            onPress={() => setTimeRange('week')}
            style={[
              styles.timeButton,
              {
                backgroundColor: timeRange === 'week' 
                  ? theme.colors.primary 
                  : theme.colors.surfaceVariant,
              }
            ]}
          >
            <Text style={[
              styles.timeButtonText,
              {
                color: timeRange === 'week'
                  ? '#FFFFFF'
                  : theme.colors.onSurfaceVariant,
                fontWeight: timeRange === 'week' ? '600' : '500',
              }
            ]}>
              Tuần
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTimeRange('month')}
            style={[
              styles.timeButton,
              {
                backgroundColor: timeRange === 'month' 
                  ? theme.colors.primary 
                  : theme.colors.surfaceVariant,
              }
            ]}
          >
            <Text style={[
              styles.timeButtonText,
              {
                color: timeRange === 'month'
                  ? '#FFFFFF'
                  : theme.colors.onSurfaceVariant,
                fontWeight: timeRange === 'month' ? '600' : '500',
              }
            ]}>
              Tháng
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Widget */}
        <SummaryWidget
          income={currentStats?.income || 0}
          expense={currentStats?.expense || 0}
          incomeChange={changesData.income}
          expenseChange={changesData.expense}
          timeRange={timeRange}
        />

        {/* Expense Chart Widget */}
        <ExpenseChartWidget
          data={barChartData}
          currentExpense={currentStats?.expense || 0}
          previousExpense={previousStats?.expense || 0}
          dateRange={formatDateRange()}
        />

        {/* Category Chart Widget */}
        <CategoryChartWidget
          data={pieChartData}
          totalAmount={topCategories.reduce((sum, cat) => sum + cat.amount, 0)}
        />

        {/* Top Categories Widget */}
        <TopCategoriesWidget categories={topCategories} />

        {/* Recent Transactions Widget */}
        <RecentTransactionsWidget transactions={recentTransactions} />
      </ScrollView>

      {/* Streak Modals */}
      {streakData && (
        <>
          <StreakWarningModal
            visible={showWarningModal}
            onDismiss={() => setShowWarningModal(false)}
            onActionPress={() => {
              setShowWarningModal(false);
              navigation.navigate('Thêm');
            }}
            streakDays={streakData.streak?.streakDays || 0}
          />

          <StreakLostModal
            visible={showLostModal}
            onDismiss={() => setShowLostModal(false)}
            onRestartPress={() => {
              setShowLostModal(false);
              navigation.navigate('Thêm');
            }}
            lostStreakDays={streakData.settings?.bestStreak || 0}
          />

          <StreakMilestoneModal
            visible={showMilestoneModal}
            onDismiss={() => setShowMilestoneModal(false)}
            onSharePress={() => {
              setShowMilestoneModal(false);
              // TODO: Implement share functionality
            }}
            milestone={getStreakState(streakData).milestone || 0}
          />
        </>
      )}

      {/* AI Assistant FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            bottom: insets.bottom,
            transform: [{ rotate: shakeAnimation.interpolate({
              inputRange: [-10, 10],
              outputRange: ['-5deg', '5deg'],
            })}],
          },
        ]}
      >
        <FAB
          icon="robot"
          style={[
            styles.fab,
            {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => navigation.navigate('Chatbot')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeButtonText: {
    fontSize: 15,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  emptyChart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyChartSubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerLabelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  centerLabelSubtext: {
    fontSize: 12,
  },
  pieChartLegend: {
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendIcon: {
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  listCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryRank: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMeta: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  reminderBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyList: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  emptyIconWrapper: {
    opacity: 0.3,
    marginBottom: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    zIndex: 1000,
  },
  fab: {
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
