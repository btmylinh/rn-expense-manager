import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Button,
  FAB,
  Menu,
  Chip,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../navigators/RootNavigator';
import { useAppTheme } from '../../theme';
import { savingsGoalApi } from '../../api/savingsGoalApi';
import { transactionApi } from '../../api/transactionApi';
// Trigger tự động xử lý streak khi có transaction, không cần import triggerStreakActivity
import {
  TRANSFER_CATEGORY,
  getTodayDate,
} from '../../common/transactionCategories';
import { getErrorMessage } from '../../utils/errorHandler';
import SavingsGoalCard from '../../components/SavingsGoalCard';
import AppBar from '../../components/AppBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SavingsGoalsScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp>();

  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [sortBy, setSortBy] = useState<
    'newest' | 'deadline' | 'progress_high' | 'progress_low'
  >('newest');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'completed' | 'cancelled'
  >('all');
  const [snack, setSnack] = useState('');

  const loadGoals = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 1000 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await savingsGoalApi.getSavingsGoals(params);
      const goalsData = response.data?.data?.goals || [];

      const mappedGoals = goalsData.map((goal: any) => ({
        ...goal,
        targetAmount: Number(goal.target_amount),
        currentAmount: Number(goal.current_amount),
        progress:
          goal.target_amount > 0
            ? (goal.current_amount / goal.target_amount) * 100
            : 0,
        createdAt: goal.created_at,
      }));

      setGoals(mappedGoals);
    } catch (error: any) {
      console.warn('Error loading savings goals:', error);
      setSnack(
        getErrorMessage(error, 'Không thể tải mục tiêu tiết kiệm'),
      );
    } finally {
      setLoading(false);
    }
  };

  // Reload when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      loadGoals();
    }, []),
  );

  // Reload when status filter changes
  React.useEffect(() => {
    loadGoals();
  }, [statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  };

  const handleAddMoney = async (
    goalId: number,
    amount: number,
    note?: string,
    walletId?: number | null,
  ): Promise<boolean> => {
    try {
      if (walletId !== undefined && walletId !== null) {
        await transactionApi.createTransaction({
          wallet_id: walletId,
          user_category_id: TRANSFER_CATEGORY.SAVINGS.id,
          amount,
          transaction_date: getTodayDate(),
          content: 'Tiết kiệm cho mục tiêu',
          type: TRANSFER_CATEGORY.SAVINGS.type,
        });
      }

      await savingsGoalApi.createContribution(goalId, { amount, note });
      // Trigger tự động xử lý streak khi có transaction, không cần gọi API activate

      setGoals(prev =>
        prev.map(goal => {
          if (goal.id !== goalId) return goal;

          const newCurrent = goal.currentAmount + amount;
          const newProgress =
            goal.targetAmount > 0
              ? (newCurrent / goal.targetAmount) * 100
              : 0;

          return {
            ...goal,
            currentAmount: newCurrent,
            progress: newProgress,
            status:
              newCurrent >= goal.targetAmount
                ? 'completed'
                : goal.status,
          };
        }),
      );

      return true;
    } catch (error) {
      console.error('Error adding contribution:', error);
      return false;
    }
  };

  const sortedGoals = [...goals].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      case 'deadline':
        return (
          new Date(a.deadline).getTime() -
          new Date(b.deadline).getTime()
        );
      case 'progress_high':
        return (b.progress || 0) - (a.progress || 0);
      case 'progress_low':
        return (a.progress || 0) - (b.progress || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <AppBar
          title="Mục tiêu tiết kiệm"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.centerContent}>
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.onSurface },
            ]}
          >
            Đang tải...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <AppBar
        title="Mục tiêu tiết kiệm"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {sortedGoals.map(goal => (
          <SavingsGoalCard
            key={goal.id}
            goal={goal}
            onPress={() =>
              navigation.navigate('SavingsGoalDetail', {
                goalId: goal.id,
              })
            }
            onAddMoney={(amount, note, walletId) =>
              handleAddMoney(goal.id, amount, note, walletId)
            }
            onEdit={() =>
              navigation.navigate('SavingsGoalCreate', {
                goalId: goal.id,
              })
            }
          />
        ))}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() =>
          navigation.navigate('SavingsGoalCreate', {})
        }
      />

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack('')}
        duration={3000}
        style={{ backgroundColor: theme.colors.errorContainer }}
      >
        <Text
          style={{ color: theme.colors.onErrorContainer }}
        >
          {snack}
        </Text>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { fontSize: 16 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
