import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Chip } from 'react-native-paper';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useAppTheme, getIconColor } from '../../theme';
import { formatCurrency } from '../../utils/format';
import { fakeApi } from '../../services/fakeApi';
import AppBar from '../../components/AppBar';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CategorySpending {
  category: {
    id: number;
    name: string;
    icon?: string;
  };
  amount: number;
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const userId = 1;

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

  // Load data
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [timeRange])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get all data using new APIs
      const [summaryResult, barChartResult, pieChartResult, topCategoriesResult, recentTxsResult, categoriesResult] = await Promise.all([
        fakeApi.getDashboardSummary(userId, timeRange),
        fakeApi.getDashboardBarChartData(userId, timeRange),
        fakeApi.getDashboardPieChartData(userId, timeRange),
        fakeApi.getDashboardTopCategories(userId, timeRange, 3),
        fakeApi.getDashboardRecentTransactions(userId, 3),
        fakeApi.getUserCategories(userId),
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
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBar title="Tổng quan" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeSelector}>
          <Chip
            selected={timeRange === 'week'}
            onPress={() => setTimeRange('week')}
            style={styles.timeChip}
            selectedColor={theme.colors.primary}
          >
            Tuần
          </Chip>
          <Chip
            selected={timeRange === 'month'}
            onPress={() => setTimeRange('month')}
            style={styles.timeChip}
            selectedColor={theme.colors.primary}
          >
            Tháng
          </Chip>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          {/* Income Card */}
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.summaryCardHeader}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Thu nhập
                </Text>
                <MaterialCommunityIcons name="trending-up" size={20} color="#22C55E" />
              </View>
              <Text style={[styles.summaryAmount, { color: '#22C55E' }]}>
                {currentStats ? formatCurrency(currentStats.income) : '0 ₫'}
              </Text>
              {changesData.income !== 0 && (
                <Text style={[styles.summaryChange, { color: changesData.income > 0 ? '#22C55E' : '#EF4444' }]}>
                  {changesData.income > 0 ? '↑' : '↓'} {Math.abs(changesData.income).toFixed(1)}% so với {timeRange === 'week' ? 'tuần trước' : 'tháng trước'}
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Expense Card */}
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.summaryCardHeader}>
                <Text style={[styles.summaryLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Chi tiêu
                </Text>
                <MaterialCommunityIcons name="trending-down" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.summaryAmount, { color: '#EF4444' }]}>
                {currentStats ? formatCurrency(currentStats.expense) : '0 ₫'}
              </Text>
              {changesData.expense !== 0 && (
                <Text style={[styles.summaryChange, { color: changesData.expense > 0 ? '#EF4444' : '#22C55E' }]}>
                  {changesData.expense > 0 ? '↑' : '↓'} {Math.abs(changesData.expense).toFixed(1)}% so với {timeRange === 'week' ? 'tuần trước' : 'tháng trước'}
                </Text>
              )}
            </Card.Content>
          </Card>
        </View>

        {/* Bar Chart - Expense Comparison */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              So sánh chi tiêu
            </Text>
            <Text style={[styles.chartSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              {formatDateRange()}
            </Text>
            {barChartData.length > 0 ? (
              <View style={styles.chartWrapper}>
                <BarChart
                  data={barChartData}
                  width={SCREEN_WIDTH - 120}
                  height={280}
                  spacing={80}
                  barWidth={60}
                  barBorderRadius={10}
                  noOfSections={5}
                  maxValue={Math.max(
                    currentStats?.expense || 0,
                    previousStats?.expense || 0
                  ) * 1.2}
                  yAxisThickness={1}
                  xAxisThickness={1}
                  yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
                  xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 14, fontWeight: 'bold' }}
                  showGradient={false}
                  isAnimated
                  animationDuration={800}
                  backgroundColor={theme.colors.surface}
                  rulesColor={theme.colors.outline}
                  rulesType="solid"
                />
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={[styles.emptyChartText, { color: theme.colors.onSurfaceVariant }]}>
                  Chưa có dữ liệu
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Pie Chart - Category Distribution */}
        <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.chartTitle, { color: theme.colors.onSurface }]}>
              Chi tiêu theo danh mục
            </Text>
            {pieChartData.length > 0 ? (
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={pieChartData}
                  radius={100}
                  innerRadius={50}
                  innerCircleColor={theme.colors.surface}
                  centerLabelComponent={() => {
                    const total = topCategories.reduce((sum, cat) => sum + cat.amount, 0);
                    return (
                      <View style={styles.centerLabel}>
                        <Text style={[styles.centerLabelText, { color: theme.colors.onSurface }]}>
                          {formatCurrency(total)}
                        </Text>
                        <Text style={[styles.centerLabelSubtext, { color: theme.colors.onSurfaceVariant }]}>
                          Tổng chi
                        </Text>
                      </View>
                    );
                  }}
                />
                <View style={styles.pieChartLegend}>
                  {pieChartData.map((item, index) => {
                    return (
                      <View key={item.category.id} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <MaterialCommunityIcons
                          name={(item.category.icon as any) || 'tag-outline'}
                          size={16}
                          color={getIconColor(item.category.icon, theme)}
                          style={styles.legendIcon}
                        />
                        <Text style={[styles.legendText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                          {item.category.name}
                        </Text>
                        <Text style={[styles.legendAmount, { color: theme.colors.onSurfaceVariant }]}>
                          {item.text}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Text style={[styles.emptyChartText, { color: theme.colors.onSurfaceVariant }]}>
                  Chưa có dữ liệu
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Top 3 Categories */}
        <Card style={[styles.listCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.listHeader}>
              <MaterialCommunityIcons name="trophy" size={24} color={theme.colors.primary} />
              <Text style={[styles.listTitle, { color: theme.colors.onSurface }]}>
                Top 3 danh mục chi tiêu
              </Text>
            </View>
            {topCategories.length > 0 ? (
              <View style={styles.categoryList}>
                {topCategories.map((item, index) => {
                  const categoryColor = getIconColor(item.category.icon, theme);
                  return (
                    <View key={item.category.id} style={styles.categoryItem}>
                      <View style={styles.categoryRank}>
                        <Text style={[styles.rankText, { color: theme.colors.onSurfaceVariant }]}>
                          #{index + 1}
                        </Text>
                      </View>
                      <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '22' }]}>
                        <MaterialCommunityIcons
                          name={(item.category.icon as any) || 'tag-outline'}
                          size={24}
                          color={categoryColor}
                        />
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                          {item.category.name}
                        </Text>
                      </View>
                      <Text style={[styles.categoryAmount, { color: theme.colors.error }]}>
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyList}>
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Chưa có dữ liệu
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Recent Transactions */}
        <Card style={[styles.listCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.listHeader}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.listTitle, { color: theme.colors.onSurface }]}>
                Giao dịch gần đây
              </Text>
            </View>
            {recentTransactions.length > 0 ? (
              <View style={styles.transactionList}>
                {recentTransactions.map((tx) => {
                  const categoryColor = getIconColor(tx.category?.icon, theme);

                  return (
                    <View key={tx.id} style={styles.transactionItem}>
                      <View style={[styles.transactionIcon, { backgroundColor: categoryColor + '22' }]}>
                        <MaterialCommunityIcons
                          name={(tx.category?.icon as any) || 'tag-outline'}
                          size={20}
                          color={categoryColor}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
                          {tx.title}
                        </Text>
                        <Text style={[styles.transactionMeta, { color: theme.colors.onSurfaceVariant }]}>
                          {tx.category?.name} • {tx.formattedDate}
                        </Text>
                      </View>
                      <Text style={[
                        styles.transactionAmount,
                        { color: tx.isIncome ? '#22C55E' : '#EF4444' }
                      ]}>
                        {tx.isIncome ? '+' : '-'}{formatCurrency(tx.displayAmount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyList}>
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Chưa có giao dịch
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
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
  },
  timeRangeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  timeChip: {
    marginRight: 8,
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
    fontSize: 14,
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
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
