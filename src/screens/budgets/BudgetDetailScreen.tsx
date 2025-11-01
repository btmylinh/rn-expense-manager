import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { Button, ProgressBar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { useAppTheme, getIconColor } from '../../theme';
import { fakeApi } from '../../services/fakeApi';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigators/RootNavigator';
import AppBar from '../../components/AppBar';

type Props = NativeStackScreenProps<RootStackParamList, 'BudgetDetail'>;

export default function BudgetDetailScreen({ navigation, route }: Props) {
  const { budgetId, readOnly = false } = route.params;
  const theme = useAppTheme();
  const [budget, setBudget] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = 1;

  useEffect(() => {
    loadBudgetDetail();
  }, [budgetId]);

  const loadBudgetDetail = async () => {
    try {
      setLoading(true);
      // Load budget data
      const budgets = await fakeApi.getBudgets(userId);
      const budgetData = budgets.find((b: any) => b.id === budgetId);
      
      if (!budgetData) {
        Alert.alert('Lỗi', 'Không tìm thấy ngân sách');
        navigation.goBack();
        return;
      }

      setBudget(budgetData);

      // Load category
      const categories = await fakeApi.getUserCategories(userId);
      const categoryData = categories.find((c: any) => c.id === budgetData.userCategoryId);
      setCategory(categoryData);

      // Load wallet
      const walletData = await fakeApi.getWallet(userId, budgetData.walletId);
      setWallet((walletData as any)?.wallet);

      // Transactions data is now included in budget.chartData from API
      setTransactions([]); // Not needed anymore

    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu ngân sách');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('BudgetCreate', {
      categories: [category],
      budget,
      editMode: true,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa ngân sách',
      'Bạn có chắc chắn muốn xóa ngân sách này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await fakeApi.deleteBudget(userId, budgetId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa ngân sách');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });  
  };

  const getChartData = () => {
    if (!budget || !budget.chartData || budget.chartData.length === 0) {
      return [];
    }

    // Sử dụng dữ liệu biểu đồ từ API
    const chartData = budget.chartData.map((item: any, index: number) => {
      const date = new Date(item.date);
      
      // Only show labels for first and last day
      const isFirstDay = index === 0;
      const isLastDay = index === budget.chartData.length - 1;
      const showLabel = isFirstDay || isLastDay;
      
      return {
        value: item.value,
        label: showLabel ? `${date.getDate()}/${date.getMonth() + 1}` : '',
        labelTextStyle: { color: theme.colors.onSurfaceVariant, fontSize: 6 as const },
      };
    });

    return chartData;
  };

  const getDaysRemaining = () => {
    const today = new Date();
    const endDate = new Date(budget.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'ngày cuối';
    if (diffDays < 0) return `${Math.abs(diffDays)} ngày trước`;
    return `Còn ${diffDays} ngày`;
  };

  const getAverageSpending = () => {
    const startDate = new Date(budget.startDate);
    const today = new Date();
    const endDate = new Date(budget.endDate);
    
    // Calculate days passed (not including future days)
    const daysPassed = Math.max(1, Math.ceil((Math.min(today.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    return budget.spent / daysPassed;
  };

  const getSpendingAdvice = () => {
    const progress = budget.spent / budget.amount;
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    const today = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysPassed = Math.max(1, Math.ceil((Math.min(today.getTime(), endDate.getTime()) - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const timeProgress = daysPassed / totalDays;

    if (progress >= 1) {
      return { text: 'Bạn đã vượt quá ngân sách!', color: theme.colors.error };
    } else if (progress > timeProgress + 0.1) {
      return { text: 'Chi tiêu nhanh hơn dự kiến, hãy cân nhắc!', color: '#F59E0B' };
    } else if (progress < timeProgress - 0.1) {
      return { text: 'Chi tiêu ít hơn dự kiến, tốt lắm!', color: theme.colors.primary };
    } else {
      return { text: 'Chi tiêu đúng kế hoạch', color: theme.colors.primary };
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing(3),
    },
    categoryHeader: {
      alignItems: 'center',
      marginBottom: theme.spacing(3),
    },
    categoryIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing(1.5),
    },
    categoryName: {
      ...theme.semantic.typography.h2,
      color: theme.colors.onSurface,
      fontWeight: '700',
      fontSize: 20,
      marginBottom: theme.spacing(1),
    },
    totalAmount: {
      ...theme.semantic.typography.h1,
      color: theme.colors.onSurface,
      fontWeight: '800',
      fontSize: 28,
    },
    statsContainer: {
      marginBottom: theme.spacing(3),
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing(1),
    },
    statLabel: {
      ...theme.semantic.typography.body,
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    statValue: {
      ...theme.semantic.typography.body,
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 14,
    },
    progressContainer: {
      marginTop: theme.spacing(2),
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.outline,
    },
    infoSection: {
      marginBottom: theme.spacing(3),
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing(2),
    },
    infoIcon: {
      marginRight: theme.spacing(1.5),
    },
    infoText: {
      ...theme.semantic.typography.body,
      color: theme.colors.onSurface,
      fontSize: 15,
      fontWeight: '500',
    },
    infoSubtext: {
      ...theme.semantic.typography.small,
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
      marginLeft: theme.spacing(4.5),
      // marginTop: theme.spacing(0.5),
      marginBottom: theme.spacing(2),

    },
    chartSection: {
      marginBottom: theme.spacing(3),
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: theme.spacing(2),
      minHeight: 280,
    },
    chartTitle: {
      ...theme.semantic.typography.body,
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: theme.spacing(2),
      textAlign: 'center',
    },
    noDataContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 160,
    },
    chartPlaceholder: {
      ...theme.semantic.typography.body,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontSize: 14,
      marginTop: theme.spacing(1),
    },
    summarySection: {
      marginBottom: theme.spacing(3),
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing(1.5),
    },
    summaryLabel: {
      ...theme.semantic.typography.body,
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
    },
    summaryValue: {
      ...theme.semantic.typography.body,
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 14,
    },
    adviceText: {
      ...theme.semantic.typography.small,
      fontWeight: '500',
      fontSize: 13,
      marginTop: theme.spacing(1),
    },
    actionButton: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
    },
  });

  if (loading || !budget) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  const progress = Math.min(budget.spent / budget.amount, 1);
  const remaining = budget.amount - budget.spent;
  const averageSpending = getAverageSpending();
  const advice = getSpendingAdvice();

  return (
    <View style={styles.container}>
      {/* AppBar */}
      <AppBar
        title={readOnly ? "Lịch sử ngân sách" : "Xem ngân sách"}
        onBack={() => navigation.goBack()}
        rightIcons={readOnly ? [
          { 
            name: 'format-list-bulleted', 
            onPress: () => navigation.navigate('TransactionList', { budgetId: budget.id }),
            iconColor: theme.colors.primary 
          },
          { name: 'delete', onPress: handleDelete, iconColor: theme.colors.error },

        ] : [
          { 
            name: 'format-list-bulleted', 
            onPress: () => navigation.navigate('TransactionList', { budgetId: budget.id }),
            iconColor: theme.colors.primary 
          },
          { name: 'pencil', onPress: handleEdit, iconColor: theme.colors.onSurface },
          { name: 'delete', onPress: handleDelete, iconColor: theme.colors.error },
        ]}
        align="between"
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Category Header - Centered */}
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryIcon, { backgroundColor: getIconColor(category?.icon, theme) + '22' }]}>
            <MaterialCommunityIcons 
              name={category?.icon || 'tag-outline'} 
              size={28} 
              color={getIconColor(category?.icon, theme)} 
            />
          </View>
          <Text style={styles.categoryName}>{category?.name || 'Danh mục'}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(budget.amount)}</Text>
        </View>

        {/* Budget Stats - Simple rows */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Đã chi</Text>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {formatCurrency(budget.spent)}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Còn lại</Text>
            <Text style={[styles.statValue, { color: remaining >= 0 ? theme.colors.primary : theme.colors.error }]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={progress} 
              color={progress >= 0.9 ? theme.colors.error : theme.colors.primary}
              style={styles.progressBar}
            />
          </View>
        </View>

        {/* Time & Wallet Info - Clean layout */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons 
              name="calendar-range" 
              size={18} 
              color={theme.colors.onSurfaceVariant}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              {formatDate(budget.startDate)} – {formatDate(budget.endDate)}
            </Text>
            <Text style={styles.infoSubtext}>{getDaysRemaining()}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons 
              name="wallet-outline" 
              size={18} 
              color={theme.colors.onSurfaceVariant}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>{wallet?.name || 'Ví'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons 
              name={budget.isRepeat ? "repeat" : "repeat-off"} 
              size={18} 
              color={budget.isRepeat ? theme.colors.primary : theme.colors.onSurfaceVariant}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              {budget.isRepeat ? 'Lặp lại ngân sách' : 'Không lặp lại'}
            </Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Biểu đồ chi tiêu theo ngày</Text>
          {getChartData().length > 0 ? (
            <LineChart
              data={getChartData()}
              width={Dimensions.get('window').width - 32}
              height={220}
              color={getIconColor(category?.icon, theme)}
              thickness={2}
              startFillColor={getIconColor(category?.icon, theme)}
              endFillColor={getIconColor(category?.icon, theme)}
              startOpacity={0.2}
              endOpacity={0.05}
              areaChart={true}
              curved={true}
              hideDataPoints={true}
              showVerticalLines={false}
              spacing={Math.max(3, (Dimensions.get('window').width - 80) / Math.max(getChartData().length - 1, 1))}
              backgroundColor={theme.colors.surface}
              rulesColor={theme.colors.outline}
              rulesType="solid"
              xAxisColor={theme.colors.outline}
              yAxisColor={theme.colors.outline}
              xAxisLabelTextStyle={{
                color: theme.colors.onSurfaceVariant,
                fontSize: 11,
                fontWeight: '500' as const,
              }}
              yAxisTextStyle={{
                color: theme.colors.onSurfaceVariant,
                fontSize: 10,
              }}
              initialSpacing={5}
              endSpacing={0}
              maxValue={budget.amount}
              noOfSections={4}
              yAxisLabelSuffix=""
              formatYLabel={(value) => formatCurrency(Number(value))}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons 
                name="chart-line" 
                size={40} 
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.chartPlaceholder}>
                Chưa có dữ liệu chi tiêu
              </Text>
            </View>
          )}
        </View>

        {/* Summary Stats */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thực tế chi tiêu hàng ngày</Text>
            <Text style={styles.summaryValue}>{formatCurrency(averageSpending)}</Text>
          </View>
          <Text style={[styles.adviceText, { color: advice.color }]}>
            {advice.text}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
