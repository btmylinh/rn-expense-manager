import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  IconButton,
  Menu,
  Portal,
  Modal,
} from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { useAppTheme, getIconColor } from '../../theme';
import { formatCurrency } from '../../utils/format';
import AppBar from '../../components/AppBar';
import TransactionModal from '../../components/TransactionModal';
import NotificationBell from '../../components/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../api/userApi';
import { transactionApi } from '../../api/transactionApi';
import { useMetadata } from '../../contexts/MetadataContext';
import { getErrorMessage } from '../../utils/errorHandler';

interface Transaction {
  id: number;
  userId: number;
  walletId: number;
  userCategoryId: number;
  amount: number;
  transactionDate: string;
  content?: string;
  note?: string;
  type: number; // 1 income, 2 expense
  category?: {
    id: number;
    name: string;
    icon?: string;
    type: number;
  };
  wallet?: {
    id: number;
    name: string;
  };
}

interface FilterState {
  startDate: Date | null;
  endDate: Date | null;
  categoryId: number | null;
  walletId: number | null;
}

export default function TransactionsScreen({ navigation }: any) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const numericUserId = user?.id;
  const hasValidUser = typeof numericUserId === 'number' && !Number.isNaN(numericUserId) && numericUserId > 0;

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userSummary, setUserSummary] = useState<{ id: number; name?: string; email?: string } | null>(null);
  const { categories, wallets, ensureCategories, ensureWallets } = useMetadata();
  const metaRef = useRef<{ categories: any[]; wallets: any[] }>({ categories: [], wallets: [] });
  const metaLoadedRef = useRef(false);
  const PAGE_LIMIT = 40;

  useEffect(() => {
    if (categories.length) {
      metaRef.current.categories = categories;
    }
  }, [categories]);

  useEffect(() => {
    if (wallets.length) {
      metaRef.current.wallets = wallets;
    }
  }, [wallets]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterState>({
    startDate: null,
    endDate: null,
    categoryId: null,
    walletId: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchTransactions = useCallback(
    async (targetPage: number = 1, append: boolean = false) => {
      if (!hasValidUser || !numericUserId) {
        setTransactions([]);
        setFilteredTransactions([]);
        setLoading(false);
        setIsLoadingMore(false);
        setHasMore(false);
        return;
      }

      const params = {
        page: targetPage,
        limit: PAGE_LIMIT,
        sortBy: 'transaction_date',
        sortOrder: 'DESC' as const,
      };

      if (append) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        let txsResponse;
        if (!metaLoadedRef.current) {
          const [response, categoryList, walletList] = await Promise.all([
            transactionApi.getTransactions(params),
            ensureCategories(),
            ensureWallets(),
          ]);
          txsResponse = response;
          metaRef.current = {
            categories: Array.isArray(categoryList) ? categoryList : categories,
            wallets: Array.isArray(walletList) ? walletList : wallets,
          };
          metaLoadedRef.current = true;
        } else {
          txsResponse = await transactionApi.getTransactions(params);
        }

        const payload = txsResponse.data?.data ?? {};
        const txs =
          payload.transactions ??
          txsResponse.data?.transactions ??
          [];
        const totalPages =
          payload.totalPages ??
          payload.total_pages ??
          (payload.total ? Math.ceil(payload.total / PAGE_LIMIT) : 1);

        const categorySource =
          metaRef.current.categories.length > 0 ? metaRef.current.categories : categories;
        const walletSource =
          metaRef.current.wallets.length > 0 ? metaRef.current.wallets : wallets;

        const catMap = new Map((categorySource || []).map(cat => [cat.id, cat]));
        const walletMap = new Map((walletSource || []).map(wallet => [wallet.id, wallet]));

        const enrichedTransactions: Transaction[] = txs.map((tx: any) => {
          const category = catMap.get(tx.user_category_id);
          const wallet = walletMap.get(tx.wallet_id);
          return {
            id: tx.id,
            userId: tx.user_id,
            walletId: tx.wallet_id,
            userCategoryId: tx.user_category_id,
            amount: tx.amount,
            transactionDate: tx.transaction_date,
            content: tx.content,
            type: tx.type,
            category,
            wallet,
          };
        });

        setTransactions(prev => {
          if (!append) {
            return enrichedTransactions;
          }
          const existingIds = new Set(prev.map(item => item.id));
          const merged = enrichedTransactions.filter(tx => !existingIds.has(tx.id));
          return [...prev, ...merged];
        });

        setPage(targetPage);
        setHasMore(targetPage < (totalPages || 1));
      } catch (error) {
        console.error('Error loading transactions:', error);
        if (!append) {
          Alert.alert('Lỗi', 'Không thể tải danh sách giao dịch');
        }
      } finally {
        if (append) {
          setIsLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [PAGE_LIMIT, categories, ensureCategories, ensureWallets, hasValidUser, numericUserId, wallets]
  );

  useEffect(() => {
    fetchTransactions(1, false);
  }, [fetchTransactions]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(1, false);
    }, [fetchTransactions])
  );

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loading || isLoadingMore) {
      return;
    }
    fetchTransactions(page + 1, true);
  }, [fetchTransactions, hasMore, isLoadingMore, loading, page]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const threshold = 120;
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold) {
        handleLoadMore();
      }
    },
    [handleLoadMore]
  );

  const loadUserProfile = useCallback(async () => {
    if (!hasValidUser || !numericUserId) {
      setUserSummary(null);
      return;
    }

    try {
      const response = await userApi.getUserById(numericUserId);
      const payload = response.data?.user;
      if (payload?.id) {
        setUserSummary({
          id: typeof payload.id === 'number' ? payload.id : Number(payload.id),
          name: payload.name,
          email: payload.email,
        });
      }
    } catch (error) {
      console.warn('Unable to load user profile', error);
    }
  }, [hasValidUser, numericUserId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        (tx.content || tx.note || '').toLowerCase().includes(query) ||
        (tx.category?.name || '').toLowerCase().includes(query)
      );
    }

    // Date filter
    if (filter.startDate) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.transactionDate);
        txDate.setHours(0, 0, 0, 0);
        return txDate >= filter.startDate!;
      });
    }
    if (filter.endDate) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.transactionDate);
        txDate.setHours(23, 59, 59, 999);
        return txDate <= filter.endDate!;
      });
    }

    // Category filter
    if (filter.categoryId) {
      filtered = filtered.filter(tx => tx.userCategoryId === filter.categoryId);
    }

    // Wallet filter
    if (filter.walletId) {
      filtered = filtered.filter(tx => tx.walletId === filter.walletId);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, filter]);

  // Group transactions by date
  const groupTransactionsByDate = (txs: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    txs.forEach(tx => {
      const date = new Date(tx.transactionDate);
      const dateStr = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    });
    return Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[0].split('/').reverse().join('-'));
      const dateB = new Date(b[0].split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });
  };

  // Handle transaction press
  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  // Handle save transaction
  const handleSaveTransaction = async (data: {
    amount: number;
    transactionDate: string;
    content: string;
    userCategoryId: number;
    type: number;
  }) => {
    if (!selectedTransaction) return;

    try {
      setIsSaving(true);
      if (!hasValidUser || !numericUserId) {
        Alert.alert('Lỗi', 'Không xác định được người dùng hiện tại');
        return;
      }

      await transactionApi.updateTransaction(selectedTransaction.id, {
        amount: data.amount,
        transaction_date: data.transactionDate,
        content: data.content,
        user_category_id: data.userCategoryId,
        type: data.type as 1 | 2,
      });
      await fetchTransactions(1, false);
      setShowEditModal(false);
      setSelectedTransaction(null);
      Alert.alert('Thành công', 'Đã cập nhật giao dịch');
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      Alert.alert('Lỗi', getErrorMessage(error, 'Không thể cập nhật giao dịch'));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete transaction
  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    Alert.alert(
      'Xóa giao dịch',
      'Bạn có chắc chắn muốn xóa giao dịch này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!hasValidUser || !numericUserId) {
                Alert.alert('Lỗi', 'Không xác định được người dùng hiện tại');
                return;
              }

              await transactionApi.deleteTransaction(selectedTransaction.id);
              await fetchTransactions(1, false);
              setShowEditModal(false);
              setSelectedTransaction(null);
              Alert.alert('Thành công', 'Đã xóa giao dịch');
            } catch (error: any) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Lỗi', getErrorMessage(error, 'Không thể xóa giao dịch'));
            }
          },
        },
      ]
    );
  };

  // Format date range
  const formatDateRange = () => {
    if (!filter.startDate && !filter.endDate) return 'Tất cả ngày';
    if (filter.startDate && filter.endDate) {
      return `${filter.startDate.toLocaleDateString('vi-VN')} - ${filter.endDate.toLocaleDateString('vi-VN')}`;
    }
    if (filter.startDate) {
      return `Từ ${filter.startDate.toLocaleDateString('vi-VN')}`;
    }
    if (filter.endDate) {
      return `Đến ${filter.endDate.toLocaleDateString('vi-VN')}`;
    }
    return 'Tất cả ngày';
  };

  const selectedCategory = categories.find(c => c.id === filter.categoryId);
  const selectedWallet = wallets.find(w => w.id === filter.walletId);
  const transactionGroups = groupTransactionsByDate(filteredTransactions);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBar 
        title={userSummary?.name ? `Giao dịch (${userSummary.name})` : 'Giao dịch'} 
        align="center"
        rightIcons={[
          {
            name: 'bell-outline',
            onPress: () => navigation.navigate('Notifications'),
          }
        ]}
      />

      {/* Search and Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: theme.colors.surface }]}>
        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceVariant} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholder="Tìm kiếm giao dịch..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {/* Date Filter */}
          <Menu
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.filterButton,
                  { backgroundColor: theme.colors.surfaceVariant }
                ]}
              >
                <MaterialCommunityIcons 
                  name="calendar-range" 
                  size={16} 
                  color={theme.colors.onSurfaceVariant} 
                  style={styles.filterButtonIcon}
                />
                <Text style={[styles.filterButtonText, { color: theme.colors.onSurfaceVariant }]}>
                {formatDateRange()}
                </Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setFilter(prev => ({ ...prev, startDate: null, endDate: null }));
                setShowDatePicker(false);
              }}
              title="Tất cả ngày"
            />
            <Menu.Item
              onPress={() => {
                const today = new Date();
                setFilter(prev => ({ ...prev, startDate: today, endDate: today }));
                setShowDatePicker(false);
              }}
              title="Hôm nay"
            />
            <Menu.Item
              onPress={() => {
                const today = new Date();
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                setFilter(prev => ({ ...prev, startDate: weekAgo, endDate: today }));
                setShowDatePicker(false);
              }}
              title="7 ngày qua"
            />
            <Menu.Item
              onPress={() => {
                const today = new Date();
                const monthAgo = new Date(today);
                monthAgo.setMonth(today.getMonth() - 1);
                setFilter(prev => ({ ...prev, startDate: monthAgo, endDate: today }));
                setShowDatePicker(false);
              }}
              title="Tháng này"
            />
          </Menu>

          {/* Category Filter */}
          <Menu
            visible={showCategoryMenu}
            onDismiss={() => setShowCategoryMenu(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setShowCategoryMenu(true)}
                style={[
                  styles.filterButton,
                  { backgroundColor: theme.colors.surfaceVariant }
                ]}
              >
                <MaterialCommunityIcons 
                  name={(selectedCategory?.icon as any) || 'tag-outline'} 
                  size={16} 
                  color={theme.colors.onSurfaceVariant} 
                  style={styles.filterButtonIcon}
                />
                <Text style={[styles.filterButtonText, { color: theme.colors.onSurfaceVariant }]}>
                {selectedCategory?.name || 'Tất cả danh mục'}
                </Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setFilter(prev => ({ ...prev, categoryId: null }));
                setShowCategoryMenu(false);
              }}
              title="Tất cả danh mục"
            />
            {categories.map(cat => (
              <Menu.Item
                key={cat.id}
                onPress={() => {
                  setFilter(prev => ({ ...prev, categoryId: cat.id }));
                  setShowCategoryMenu(false);
                }}
                title={cat.name}
                leadingIcon={cat.icon}
              />
            ))}
          </Menu>

          {/* Wallet Filter */}
          <Menu
            visible={showWalletMenu}
            onDismiss={() => setShowWalletMenu(false)}
            anchor={
              <TouchableOpacity
                onPress={() => setShowWalletMenu(true)}
                style={[
                  styles.filterButton,
                  { backgroundColor: theme.colors.surfaceVariant }
                ]}
              >
                <MaterialCommunityIcons 
                  name="wallet-outline" 
                  size={16} 
                  color={theme.colors.onSurfaceVariant} 
                  style={styles.filterButtonIcon}
                />
                <Text style={[styles.filterButtonText, { color: theme.colors.onSurfaceVariant }]}>
                {selectedWallet?.name || 'Tất cả ví'}
                </Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setFilter(prev => ({ ...prev, walletId: null }));
                setShowWalletMenu(false);
              }}
              title="Tất cả ví"
            />
            {wallets.map(wallet => (
              <Menu.Item
                key={wallet.id}
                onPress={() => {
                  setFilter(prev => ({ ...prev, walletId: wallet.id }));
                  setShowWalletMenu(false);
                }}
                title={wallet.name}
              />
            ))}
          </Menu>

          {/* Clear Filters */}
          {(filter.startDate || filter.endDate || filter.categoryId || filter.walletId) && (
            <TouchableOpacity
              onPress={() => {
                setFilter({
                  startDate: null,
                  endDate: null,
                  categoryId: null,
                  walletId: null,
                });
                setSearchQuery('');
              }}
              style={[
                styles.filterButton,
                { backgroundColor: theme.colors.errorContainer }
              ]}
            >
              <MaterialCommunityIcons 
                name="close-circle" 
                size={16} 
                color={theme.colors.onErrorContainer} 
                style={styles.filterButtonIcon}
              />
              <Text style={[styles.filterButtonText, { color: theme.colors.onErrorContainer }]}>
              Xóa bộ lọc
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <ScrollView
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Đang tải...</Text>
          </View>
        ) : transactionGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <MaterialCommunityIcons 
                name={searchQuery || filter.startDate || filter.categoryId || filter.walletId ? "magnify" : "receipt-text-outline"} 
                size={64} 
                color={theme.colors.primary} 
              />
            </View>
            <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
              {searchQuery || filter.startDate || filter.categoryId || filter.walletId
                ? 'Không tìm thấy giao dịch'
                : 'Bắt đầu quản lý tài chính'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
              {searchQuery || filter.startDate || filter.categoryId || filter.walletId
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                : 'Nhấn nút "+" bên dưới để thêm giao dịch đầu tiên và khám phá tính năng quản lý chi tiêu thông minh'}
            </Text>
          </View>
        ) : (
          <>
            {transactionGroups.map(([date, txs]) => (
              <View key={date}>
              {/* Date Header */}
              <View style={[styles.dateHeader, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.dateText, { color: theme.colors.onSurface }]}>{date}</Text>
                <Text style={[styles.dateTotal, { color: theme.colors.onSurfaceVariant }]}>
                  {txs.length} giao dịch
                </Text>
              </View>

              {/* Transactions */}
              {txs.map(tx => {
                const category = tx.category || categories.find(c => c.id === tx.userCategoryId);
                const isIncome = tx.type === 1;
                const categoryColor = getIconColor(category?.icon, theme);

                return (
                  <TouchableOpacity
                    key={tx.id}
                    onPress={() => handleTransactionPress(tx)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.transactionItem, { backgroundColor: theme.colors.surface }]}>
                      {/* Category Icon */}
                      <View style={[styles.categoryIcon, { backgroundColor: categoryColor + '22' }]}>
                        <MaterialCommunityIcons
                          name={(category?.icon as any) || 'tag-outline'}
                          size={24}
                          color={categoryColor}
                        />
                      </View>

                      {/* Transaction Info */}
                      <View style={styles.transactionInfo}>
                        <Text style={[styles.transactionTitle, { color: theme.colors.onSurface }]}>
                          {tx.content || tx.note || 'Giao dịch'}
                        </Text>
                        <View style={styles.transactionMeta}>
                          <Text style={[styles.categoryName, { color: theme.colors.onSurfaceVariant }]}>
                            {category?.name || 'Chưa phân loại'}
                          </Text>
                          {tx.wallet && (
                            <>
                              <Text style={[styles.metaSeparator, { color: theme.colors.onSurfaceVariant }]}>•</Text>
                              <Text style={[styles.walletName, { color: theme.colors.onSurfaceVariant }]}>
                                {tx.wallet.name}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>

                      {/* Amount */}
                      <View style={styles.transactionAmount}>
                        <Text style={[
                          styles.amountText,
                          { color: isIncome ? '#22C55E' : '#EF4444' }
                        ]}>
                          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              </View>
            ))}
            {isLoadingMore && (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadMoreText, { color: theme.colors.onSurfaceVariant }]}>
                  Đang tải thêm...
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Edit Transaction Modal */}
      {selectedTransaction && (
        <TransactionModal
          visible={showEditModal}
          mode="edit"
          transaction={{
            id: selectedTransaction.id,
            userId: selectedTransaction.userId,
            walletId: selectedTransaction.walletId,
            userCategoryId: selectedTransaction.userCategoryId,
            amount: Math.abs(selectedTransaction.amount),
            transactionDate: selectedTransaction.transactionDate,
            content: selectedTransaction.content || selectedTransaction.note || '',
            type: selectedTransaction.type,
            createdAt: selectedTransaction.transactionDate,
          }}
          categories={categories.map(cat => ({ ...cat, type: cat.type ?? 1 }))}
          onDismiss={() => {
            setShowEditModal(false);
            setSelectedTransaction(null);
          }}
          onSave={handleSaveTransaction}
          loading={isSaving}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationContainer: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  filterBar: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterChips: {
    flexDirection: 'row',
    marginTop: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonIcon: {
    marginRight: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyIconWrapper: {
    opacity: 0.4,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dateTotal: {
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
  },
  metaSeparator: {
    marginHorizontal: 6,
  },
  walletName: {
    fontSize: 14,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadMoreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 13,
  },
});
