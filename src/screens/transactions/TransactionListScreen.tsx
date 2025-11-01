import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTheme } from '../../theme';
import { formatCurrency } from '../../utils/format';
import { getIconColor } from '../../theme';
import { fakeApi } from '../../services/fakeApi';
import TransactionModal from '../../components/TransactionModal';
import AppBar from '../../components/AppBar';

type RootStackParamList = {
  TransactionList: { budgetId: number };
};

type TransactionListScreenRouteProp = RouteProp<RootStackParamList, 'TransactionList'>;
type TransactionListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function TransactionListScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<TransactionListScreenNavigationProp>();
  const route = useRoute<TransactionListScreenRouteProp>();
  const { budgetId } = route.params;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [budgetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get budget transactions data and categories
      const [result, categoriesResult] = await Promise.all([
        fakeApi.getBudgetTransactions(1, budgetId),
        fakeApi.getUserCategories(1),
      ]);
      
      if (result.success) {
        setData(result.data);
      } else {
        console.error('Error loading transaction data:', result.message);
      }
      
      if (categoriesResult) {
        setCategories(categoriesResult);
      }
    } catch (error) {
      console.error('Error loading transaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionPress = (transaction: any) => {
    // Map transaction to format expected by TransactionModal
    const transactionForModal = {
      id: transaction.id,
      userId: 1,
      walletId: data.budget?.walletId || 1,
      userCategoryId: transaction.category.id,
      amount: transaction.amount,
      transactionDate: transaction.date,
      content: transaction.content || '',
      note: transaction.content || '',
      type: transaction.type === 'income' ? 1 : 2,
      createdAt: transaction.date,
    };
    
    setSelectedTransaction(transactionForModal);
    setShowEditModal(true);
  };

  const handleSaveTransaction = async (saveData: {
    amount: number;
    transactionDate: string;
    content: string;
    userCategoryId: number;
    type: number;
  }) => {
    if (!selectedTransaction) return;
    
    setIsSaving(true);
    try {
      const result = await fakeApi.updateTransaction(1, selectedTransaction.id, saveData);
      
      if (result.success) {
        // Reload data to reflect changes
        await loadData();
        setShowEditModal(false);
        setSelectedTransaction(null);
      } else {
        Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra khi cập nhật giao dịch');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật giao dịch');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const getDateLabel = (dateString: string): { dayNumber: string; dayLabel: string; monthYear: string } => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dayNumber = date.getDate().toString();
    const monthYear = `tháng ${date.getMonth() + 1} ${date.getFullYear()}`;

    let dayLabel = '';
    if (date.toDateString() === today.toDateString()) {
      dayLabel = 'Hôm nay';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dayLabel = 'Hôm qua';
    } else {
      dayLabel = date.toLocaleDateString('vi-VN', { weekday: 'long' });
      // Capitalize first letter
      dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
    }

    return { dayNumber, dayLabel, monthYear };
  };

  const formatAmount = (amount: number): string => {
    return Math.abs(amount).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <AppBar
          title="Danh sách giao dịch"
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

  if (!data) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <AppBar
          title="Danh sách giao dịch"
          onBack={() => navigation.goBack()}
          align="center"
        />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="receipt-text-outline" 
            size={48} 
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            Không có dữ liệu
          </Text>
        </View>
      </View>
    );
  }

  const { summary, transactionGroups } = data;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* AppBar */}
      <AppBar
        title="Danh sách giao dịch"
        onBack={() => navigation.goBack()}
        align="center"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Enhanced Summary Section */}
        <View style={[
          styles.summarySection, 
          { 
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outline + '20',
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.primary,
          }
        ]}>
          {/* Header with icon */}
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialCommunityIcons 
                name="receipt-text" 
                size={24} 
                color={theme.colors.primary} 
              />
            </View>
            <View style={styles.summaryHeaderText}>
              <Text style={[styles.summaryTitle, { color: theme.colors.onSurface }]}>
                Chi tiêu ngân sách
              </Text>
              <Text style={[styles.resultCount, { color: theme.colors.onSurface }]}>
                {summary.count} giao dịch chi tiêu
              </Text>
            </View>
          </View>
          
          {/* Single Expense Card */}
          <View style={[
            styles.expenseCard,
            { 
              backgroundColor: theme.colors.primary + '10',
              borderColor: theme.colors.primary + '30'
            }
          ]}>
            <View style={styles.expenseHeader}>
              <MaterialCommunityIcons 
                name="trending-down" 
                size={24} 
                color={theme.colors.primary} 
              />
              <View style={styles.expenseInfo}>
                <Text style={[styles.expenseLabel, { color: theme.colors.onSurface }]}>
                  Tổng chi tiêu
                </Text>
                <Text style={[styles.expenseSubtext, { color: theme.colors.onSurface }]}>
                  Trong khoảng thời gian ngân sách
                </Text>
              </View>
            </View>
            <Text style={[styles.expenseValue, { color: theme.colors.primary }]}>
              {formatCurrency(summary.expense)}
            </Text>
          </View>
        </View>

        {/* Transaction Groups */}
        {transactionGroups.length > 0 ? (
          transactionGroups.map((group: any) => {
            const { dayNumber, dayLabel, monthYear } = getDateLabel(group.date);
            // Lấy màu từ giao dịch đầu tiên trong group
            const groupColor = group.transactions.length > 0 
              ? getIconColor(group.transactions[0].category.icon, theme)
              : theme.colors.primary;
            
            return (
              <View key={group.date} style={[
                styles.dateGroup,
                { 
                  backgroundColor: theme.colors.surface,
                  borderLeftWidth: 3,
                  borderLeftColor: groupColor + '40'
                }
              ]}>
                {/* Date Header */}
                <View style={[
                  styles.dateHeader, 
                  { 
                    backgroundColor: groupColor + '10',
                    borderBottomColor: groupColor + '20'
                  }
                ]}>
                  <View style={styles.dateHeaderLeft}>
                    <View style={[
                      styles.dayNumberContainer,
                      { backgroundColor: groupColor + '20' }
                    ]}>
                      <Text style={[styles.dayNumber, { color: groupColor }]}>
                        {dayNumber}
                      </Text>
                    </View>
                    <View style={styles.dateLabels}>
                      <Text style={[styles.dayLabel, { color: theme.colors.onSurface }]}>
                        {dayLabel}
                      </Text>
                      <Text style={[styles.monthYear, { color: theme.colors.onSurface }]}>
                        {monthYear}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[
                    styles.totalContainer,
                    { backgroundColor: groupColor + '20' }
                  ]}>
                    <Text style={[styles.dayTotal, { color: groupColor }]}>
                      {group.total < 0 ? '-' : ''}{formatAmount(group.total)}
                    </Text>
                  </View>
                </View>

                {/* Transactions */}
                <View style={[styles.transactionList, { backgroundColor: theme.colors.surface }]}>
                  {group.transactions.map((transaction: any, index: number) => (
                    <TouchableOpacity
                      key={transaction.id}
                      style={[
                        styles.transactionItem,
                        { 
                          backgroundColor: theme.colors.surface,
                          borderBottomColor: groupColor + '20',
                          borderBottomWidth: index === group.transactions.length - 1 ? 0 : 0.5
                        }
                      ]}
                      onPress={() => handleTransactionPress(transaction)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.categoryIcon,
                        { 
                          backgroundColor: getIconColor(transaction.category.icon, theme) + '15',
                          borderWidth: 1,
                          borderColor: getIconColor(transaction.category.icon, theme) + '30'
                        }
                      ]}>
                        <MaterialCommunityIcons
                          name={transaction.category.icon as any}
                          size={20}
                          color={getIconColor(transaction.category.icon, theme)}
                        />
                      </View>
                      
                      <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                        {transaction.category.name}
                      </Text>
                      
                      <View style={[
                        styles.amountContainer,
                        { backgroundColor: getIconColor(transaction.category.icon, theme) + '10' }
                      ]}>
                        <Text style={[styles.transactionAmount, { color: getIconColor(transaction.category.icon, theme) }]}>
                          {formatAmount(transaction.amount)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="receipt-text-outline" 
              size={48} 
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Không có giao dịch nào trong khoảng thời gian này
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Transaction Edit Modal */}
      <TransactionModal
        visible={showEditModal}
        mode="edit"
        transaction={selectedTransaction}
        categories={categories}
        onDismiss={() => {
          setShowEditModal(false);
          setSelectedTransaction(null);
        }}
        onSave={handleSaveTransaction}
        loading={isSaving}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryHeaderText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  expenseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseInfo: {
    marginLeft: 12,
    flex: 1,
  },
  expenseLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseSubtext: {
    fontSize: 12,
    fontWeight: '400',
  },
  expenseValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateGroup: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayNumberContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateLabels: {
    justifyContent: 'center',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  monthYear: {
    fontSize: 12,
  },
  totalContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dayTotal: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionList: {
    paddingTop: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 64,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  amountContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});