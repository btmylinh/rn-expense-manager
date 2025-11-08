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
import { fakeApi } from '../../services/fakeApi';
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

const SCREEN_WIDTH = Dimensions.get('window').width;

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
  const userId = user?.id || 1;
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
  const [streakData, setStreakData] = useState<any>(null);
  const [streakLoading, setStreakLoading] = useState(true);
  
  // Streak modal states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  
  // Track if milestone modal was already shown for current milestone
  const shownMilestonesRef = useRef<Set<number>>(new Set());

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, [timeRange, userId]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      
      // Check for weekly report generation (only on Sundays)
      const today = new Date();
      if (today.getDay() === 0) { // Sunday
        fakeApi.generateWeeklyReport(userId).catch(console.error);
      }

      // Check for streak warnings and reminders
      fakeApi.checkStreakWarnings().catch(console.error);
      fakeApi.checkDailyReminders().catch(console.error);
      
      // Check for recurring expense reminders
      fakeApi.checkRecurringExpenseReminders(userId).catch(console.error);
    }, [timeRange, userId])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setStreakLoading(true);
      setStreakData(null); // Clear previous streak data

      // Get all data using new APIs
      const [summaryResult, barChartResult, pieChartResult, topCategoriesResult, recentTxsResult, categoriesResult, streakResult] = await Promise.all([
        fakeApi.getDashboardSummary(userId, timeRange),
        fakeApi.getDashboardBarChartData(userId, timeRange),
        fakeApi.getDashboardPieChartData(userId, timeRange),
        fakeApi.getDashboardTopCategories(userId, timeRange, 3),
        fakeApi.getDashboardRecentTransactions(userId, 3),
        fakeApi.getUserCategories(userId),
        fakeApi.getStreakData(userId),
      ]);

      if (summaryResult.success) {
        setCurrentStats(summaryResult.data.current);
        setPreviousStats(summaryResult.data.previous);
        setChangesData(summaryResult.data.changes);
      }

      if (barChartResult.success) {
        const formattedBarData = barChartResult.data.map(item => ({
          value: item.value,
          label: item.label,
          spacing: 2,
          labelWidth: timeRange === 'week' ? (item.type === 'current' ? 90 : 100) : (item.type === 'current' ? 110 : 120),
          labelTextStyle: { color: theme.colors.onSurface, fontSize: 14, fontWeight: 'bold' as const },
          frontColor: item.color,
        }));
        setBarChartData(formattedBarData);
      }

      if (pieChartResult.success) {
        setPieChartData(pieChartResult.data);
      }

      if (topCategoriesResult.success) {
        const formattedTopCats = topCategoriesResult.data.map(cat => ({
          category: {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
          },
          amount: cat.amount,
        }));
        setTopCategories(formattedTopCats);
      }

      if (recentTxsResult.success) {
        setRecentTransactions(recentTxsResult.data);
      }

      if (categoriesResult) {
        setCategories(categoriesResult as any[]);
      }

      if (streakResult.success) {
        const newStreakData = streakResult.data;
        const streakStatus = getStreakState(newStreakData);
        
        // Check if milestone modal was already shown for this session
        const STORAGE_KEY = `milestone_shown_${userId}_${streakStatus.milestone}`;
        
        // Show appropriate modal based on streak state
        if (streakStatus.state === StreakState.WARNING && !showWarningModal) {
          setShowWarningModal(true);
        } else if (streakStatus.state === StreakState.LOST && !showLostModal) {
          setShowLostModal(true);
        } else if (streakStatus.state === StreakState.MILESTONE && !showMilestoneModal) {
          // Check if this milestone was already shown
          const milestoneNum = streakStatus.milestone || 0;
          if (!shownMilestonesRef.current.has(milestoneNum)) {
            // Check AsyncStorage to see if shown today
            AsyncStorage.getItem(STORAGE_KEY).then((value) => {
              const today = new Date().toDateString();
              if (value !== today) {
                // Not shown today, show it
                shownMilestonesRef.current.add(milestoneNum);
                setShowMilestoneModal(true);
                // Save to storage
                AsyncStorage.setItem(STORAGE_KEY, today);
              }
            });
          }
        }
        
        setStreakData(newStreakData);
        setStreakLoading(false);
        
        // Record dashboard view as streak activity
        if (!newStreakData.todayCompleted) {
          try {
            await fakeApi.recordStreakActivity(userId, 'dashboard_view');
            // Refresh streak data after recording activity
            const updatedStreak = await fakeApi.getStreakData(userId);
            if (updatedStreak.success) {
              setStreakData(updatedStreak.data);
            }
          } catch (error) {
            // Silently fail - not critical
          }
        }
      } else {
        setStreakLoading(false);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStreakLoading(false);
    } finally {
      setLoading(false);
    }
  };


  const formatDateRange = () => {
    const now = new Date();
    if (timeRange === 'week') {
      const dayOfWeek = now.getDay();
      // Tính từ thứ 2 (Monday = 1) đến Chủ nhật (Sunday = 0)
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6 days from Monday
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysFromMonday);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Chủ nhật
      
      return `Tuần này (${weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})`;
    } else {
      return `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
    }
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
          }
        ]}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Streak Section */}
        {streakData ? (
          <StreakCard 
            key={`streak-${userId}`}
            streakStatus={getStreakState(streakData)}
            loading={streakLoading}
            onPress={() => {
              navigation.navigate('StreakDetail');
            }}
            onActionPress={() => {
              const status = getStreakState(streakData);
              if (status.state === StreakState.WARNING || status.state === StreakState.LOST) {
                navigation.navigate('Thêm');
              }
            }}
          />
        ) : (
          <View style={{ padding: 16 }}>
            <Text>Loading streak data for userId: {userId}...</Text>
          </View>
        )}

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
