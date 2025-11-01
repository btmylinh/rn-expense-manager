import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTheme, getIconColor } from '../../theme';
import { formatCurrency } from '../../utils/format';
import { fakeApi } from '../../services/fakeApi';
import AppBar from '../../components/AppBar';

type RootStackParamList = {
  BudgetHistory: undefined;
  BudgetDetail: { budgetId: number; readOnly?: boolean };
};

type BudgetHistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BudgetHistoryScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<BudgetHistoryScreenNavigationProp>();
  
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userId = 1;

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);
      
      // Load all budgets and filter expired ones
      const [budgets, categories, wallets] = await Promise.all([
        fakeApi.getBudgets(userId),
        fakeApi.getUserCategories(userId),
        fakeApi.getWallets(userId),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter expired budgets (end_date < today)
      const expiredBudgets = budgets.filter((budget: any) => {
        const endDate = new Date(budget.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate < today;
      });

      // Group by time period and add category/wallet info
      const groupedData = groupBudgetsByPeriod(expiredBudgets, categories, wallets);
      setHistoryData(groupedData);
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupBudgetsByPeriod = (budgets: any[], categories: any[], wallets: any[]) => {
    const groups: { [key: string]: any } = {};

    budgets.forEach((budget: any) => {
      const periodKey = `${budget.startDate}_${budget.endDate}`;
      
      if (!groups[periodKey]) {
        groups[periodKey] = {
          startDate: budget.startDate,
          endDate: budget.endDate,
          budgets: [],
          totalBudget: 0,
          totalSpent: 0,
        };
      }

      const category = categories.find((c: any) => c.id === budget.userCategoryId);
      const wallet = wallets.find((w: any) => w.id === budget.walletId);

      groups[periodKey].budgets.push({
        ...budget,
        category,
        wallet,
      });
      
      groups[periodKey].totalBudget += budget.amount;
      groups[periodKey].totalSpent += budget.spent || 0;
    });

    // Convert to array and sort by end date (newest first)
    return Object.values(groups).sort((a: any, b: any) => 
      new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startStr = `${start.getDate()}/${start.getMonth() + 1}`;
    const endStr = `${end.getDate()}/${end.getMonth() + 1}/${end.getFullYear()}`;
    
    return `${startStr} - ${endStr}`;
  };

  const getPerformanceColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= 90) return '#FF9500';
    return '#10B981';
  };

  const getPerformanceText = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return 'Vượt ngân sách';
    if (percentage >= 90) return 'Gần hết ngân sách';
    if (percentage >= 70) return 'Đang kiểm soát';
    return 'Tiết kiệm tốt';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <AppBar
          title="Lịch sử ngân sách"
          onBack={() => navigation.goBack()}
          align="center"
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Đang tải...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      <AppBar
        title="Lịch sử ngân sách"
        onBack={() => navigation.goBack()}
        align="center"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {historyData.length > 0 ? (
          historyData.map((period: any, index: number) => (
            <View key={index} style={[
              styles.periodCard,
              { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outline + '20'
              }
            ]}>
              {/* Period Header */}
              <View style={styles.periodHeader}>
                <View style={styles.periodInfo}>
                  <Text style={[styles.periodTitle, { color: theme.colors.onSurface }]}>
                    Kỳ {formatDateRange(period.startDate, period.endDate)}
                  </Text>
                  <Text style={[styles.periodSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                    {period.budgets.length} danh mục
                  </Text>
                </View>
                <View style={[
                  styles.performanceTag,
                  { backgroundColor: getPerformanceColor(period.totalSpent, period.totalBudget) + '20' }
                ]}>
                  <Text style={[
                    styles.performanceText,
                    { color: getPerformanceColor(period.totalSpent, period.totalBudget) }
                  ]}>
                    {getPerformanceText(period.totalSpent, period.totalBudget)}
                  </Text>
                </View>
              </View>

              {/* Period Summary */}
              <View style={styles.periodSummary}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Tổng ngân sách
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.onSurface }]}>
                    {formatCurrency(period.totalBudget)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Đã chi tiêu
                  </Text>
                  <Text style={[styles.summaryValue, { color: getPerformanceColor(period.totalSpent, period.totalBudget) }]}>
                    {formatCurrency(period.totalSpent)}
                  </Text>
                </View>
              </View>

              {/* Budget List */}
              <View style={styles.budgetList}>
                {period.budgets.map((budget: any, budgetIndex: number) => (
                  <TouchableOpacity
                    key={budgetIndex}
                    style={[
                      styles.budgetItem,
                      { 
                        borderBottomColor: theme.colors.outline + '15',
                        borderBottomWidth: budgetIndex === period.budgets.length - 1 ? 0 : 0.5
                      }
                    ]}
                    onPress={() => navigation.navigate('BudgetDetail', { 
                      budgetId: budget.id,
                      readOnly: true 
                    })}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIcon,
                      { 
                        backgroundColor: getIconColor(budget.category?.icon, theme) + '20',
                        borderColor: getIconColor(budget.category?.icon, theme) + '40'
                      }
                    ]}>
                      <MaterialCommunityIcons
                        name={budget.category?.icon as any || 'tag-outline'}
                        size={20}
                        color={getIconColor(budget.category?.icon, theme)}
                      />
                    </View>
                    
                    <View style={styles.budgetInfo}>
                      <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                        {budget.category?.name || 'Danh mục'}
                      </Text>
                      <Text style={[styles.budgetAmount, { color: theme.colors.onSurfaceVariant }]}>
                        {formatCurrency(budget.spent || 0)} / {formatCurrency(budget.amount)}
                      </Text>
                    </View>

                    <View style={styles.budgetResult}>
                      <Text style={[
                        styles.resultPercentage,
                        { color: getPerformanceColor(budget.spent || 0, budget.amount) }
                      ]}>
                        {Math.round(((budget.spent || 0) / budget.amount) * 100)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="history" 
              size={48} 
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Chưa có lịch sử ngân sách nào
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  periodCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodInfo: {
    flex: 1,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  periodSubtitle: {
    fontSize: 13,
  },
  performanceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  periodSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  budgetList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  budgetInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetAmount: {
    fontSize: 13,
  },
  budgetResult: {
    alignItems: 'flex-end',
  },
  resultPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
