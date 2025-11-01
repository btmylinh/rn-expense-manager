import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  KeyboardAvoidingView,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import {
  Text,
  Card,
  IconButton,
  Button,
  Avatar,
  Chip,
  Portal,
  Modal,
  List,
  Divider,
  SegmentedButtons,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fakeApi } from '../../services/fakeApi';
import { useFocusEffect } from '@react-navigation/native';
import { DatePickerModal } from 'react-native-paper-dates';
import CategorySelectModal from '../../components/CategorySelectModal';
import TransactionModal from '../../components/TransactionModal';
import { getIconColor, useAppTheme } from '../../theme';


interface Transaction {
  id: number;
  userId: number;
  walletId: number;
  userCategoryId: number;
  amount: number;
  storeService?: string;
  note?: string;
  content?: string;
  transactionDate: string;
  type: number;
  createdAt: string;
}

interface Wallet {
  id: number;
  userId: number;
  name: string;
  amount: number;
  currency: string;
  color?: string;
}

interface Category {
  id: number;
  userId?: number;
  name: string;
  type: number; // 1 income, 2 expense
  icon?: string;
  color?: string;
}

export default function AddTransactionScreen() {
  const theme = useTheme();
  const appTheme = useAppTheme();
  const [userName, setUserName] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [quickFocused, setQuickFocused] = useState(false);
  const quickInputRef = useRef<TextInput>(null);

  // actions state
  const [actionTx, setActionTx] = useState<Transaction | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userStreak, setUserStreak] = useState(0);

  const userId = 1;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [w, c, prefs, stats] = await Promise.all([
          fakeApi.getWallets(userId),
          fakeApi.getUserCategories(userId),
          fakeApi.getUserPreferences(userId),
          fakeApi.getTransactionStats(userId),
        ]);
        if (!mounted) return;
        
        setWallets(w as any);
        setCategories(c as any);
        
        if (prefs.success) {
          const currentId = prefs.data.currentWalletId;
        const defaultSelection = (w as any).find((x: any) => x.id === currentId) || (w as any)[0] || null;
        setSelectedWallet(defaultSelection);
          if (prefs.data.user) setUserName(prefs.data.user.name || 'Người dùng');
        }
        
        if (stats.success && stats.data.streak) {
          setUserStreak(stats.data.streak.streak || 0);
        }
      } catch { }
    })();
    return () => { mounted = false; };
  }, []);

  // Refresh wallets and categories whenever returning to this screen
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const [w, cw, c] = await Promise.all([
            fakeApi.getWallets(userId),
            fakeApi.getCurrentWalletId(userId),
            fakeApi.getUserCategories(userId),
          ]);
          if (!active) return;
          setWallets(w as any);
          setCategories(c as any);
          const currentId = (cw as any)?.walletId;
          const selected = (w as any).find((x: any) => x.id === currentId) || (w as any)[0] || null;
          setSelectedWallet(selected);
        } catch { }
      })();
      return () => { active = false; };
    }, [])
  );

  // Load wallet dashboard when selected wallet changes
  useEffect(() => {
    if (!selectedWallet) return;

    let mounted = true;
    (async () => {
      try {
        const dashboard = await fakeApi.getWalletDashboard(userId, selectedWallet.id);
        if (!mounted) return;
        
        if (dashboard.success && dashboard.data) {
          // Update wallet info with current balance
          setSelectedWallet(prev => prev ? { ...prev, amount: dashboard.data.wallet.balance } : null);
          // Set recent transactions (map to expected format)
          setTransactions(dashboard.data.recentTransactions.map((tx: any) => ({ 
            ...tx, 
            note: tx.content,
            userCategoryId: tx.category.id,
            walletId: selectedWallet.id,
            transactionDate: tx.date
          })));
        }
      } catch { }
    })();
    return () => { mounted = false; };
  }, [selectedWallet?.id]); // Only depend on wallet ID to avoid infinite loops

  // Calculate current balance
  const currentBalance = selectedWallet?.amount ?? 0;

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.transactionDate).toLocaleDateString('vi-VN');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const formatCurrency = (amount: number) => {
    const cur = selectedWallet?.currency || 'VND';
    if (cur === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    }
    // default VND
    return amount.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + '₫';
  };

  // Helper functions for input formatting
  const formatNumberInput = (text: string) => {
    // Remove all non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';

    // Convert to number and format
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('vi-VN');
  };

  const parseFormattedNumber = (text: string) => {
    // Remove all non-numeric characters and convert to number
    const numericValue = text.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };

  // Format date to YYYY-MM-DD without timezone offset (local time)
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Parse YYYY-MM-DD to Date (local time)
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString || !dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return undefined;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getCategoryInfo = (categoryId: number) => {
    const fallback: Category = { id: 0, name: 'Khác', type: 2, icon: 'tag-outline', color: '#64748B' };
    return categories.find(cat => cat.id === categoryId) || fallback;
  };

  const initials = React.useMemo(() => {
    const parts = (userName || '').trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [userName]);

  const handleWalletSelect = (wallet: any) => {
    setSelectedWallet(wallet);
    setShowWalletModal(false);
  };

  const handleQuickInput = async () => {
    if (quickInput.trim()) {
      try {
        // Parse the input
        const parseResult = await fakeApi.parseQuickInput(userId, quickInput);
        if (parseResult.success && parseResult.transactions.length > 0) {
          // Create transactions
          const createResult = await fakeApi.createQuickTransactions(userId, parseResult.transactions, selectedWallet?.id);
          if (createResult.success) {
            // Optimize: Update local state immediately instead of refetching
            if (selectedWallet && createResult.transactions) {
              const newTransactions = createResult.transactions.map((tx: any) => ({
                ...tx,
                note: tx.content || '',
                userId: userId,
                walletId: selectedWallet.id,
              }));

              // Add new transactions to the list
              setTransactions(prev => [...newTransactions, ...prev]);

              // Calculate total amount change
              const totalAmountChange = newTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
              const newBalance = selectedWallet.amount + totalAmountChange;
              const updatedWallet = { ...selectedWallet, amount: newBalance };

              setSelectedWallet(updatedWallet);
              setWallets(prev => prev.map(w =>
                w.id === selectedWallet.id ? updatedWallet : w
              ));
            }

            Alert.alert('Thành công', `Đã thêm ${createResult.transactions.length} giao dịch`);
            setQuickInput('');
          }
        } else {
          Alert.alert('Lỗi', 'Không thể phân tích dữ liệu nhập vào');
        }
      } catch (error) {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý');
      }
    }
  };

  const handleOCR = () => {
    Alert.alert('OCR', 'Tính năng quét hóa đơn sẽ được tích hợp');
  };

  const handleVoice = () => {
    Alert.alert('Voice', 'Tính năng nhập bằng giọng nói sẽ được tích hợp');
  };

  const handleAddTransaction = () => {
    Alert.alert('Add Transaction', 'Mở form thêm giao dịch');
  };

  const handleAnalyze = () => {
    Alert.alert('Analyze', 'Xem biểu đồ thống kê');
  };

  const openActions = (tx: Transaction) => {
    setActionTx(tx);
    setShowActionsSheet(true);
  };

  const openEdit = () => {
    if (!actionTx) return;
    setShowActionsSheet(false);
    setShowEditSheet(true);
  };

  const handleSaveEdit = useCallback(async (data: {
    amount: number;
    transactionDate: string;
    content: string;
    userCategoryId: number;
    type: number;
  }) => {
    if (!actionTx || !selectedWallet) return;
    setIsLoading(true);

    try {
      const result = await fakeApi.updateTransaction(userId, actionTx.id, data);

      if (result.success) {
        // Optimize: Update local state immediately instead of refetching
        const updatedTransaction = {
          ...actionTx,
          amount: data.amount,
          transactionDate: data.transactionDate,
          content: data.content,
          note: data.content,
          userCategoryId: data.userCategoryId,
          type: data.type,
        };

        // Update transactions list locally
        setTransactions(prev => prev.map(tx =>
          tx.id === actionTx.id ? updatedTransaction : tx
        ));

        // Calculate new wallet balance locally
        const amountDiff = updatedTransaction.amount - actionTx.amount;
        const newBalance = selectedWallet.amount + amountDiff;
        const updatedWallet = { ...selectedWallet, amount: newBalance };

        setSelectedWallet(updatedWallet);
        setWallets(prev => prev.map(w =>
          w.id === selectedWallet.id ? updatedWallet : w
        ));

        setShowEditSheet(false);
        setActionTx(null);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật giao dịch');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [actionTx, selectedWallet]);

  const confirmDelete = () => {
    setShowActionsSheet(false);
    if (!actionTx || !selectedWallet) return;
    Alert.alert('Xoá giao dịch', 'Bạn có chắc muốn xoá giao dịch này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive', onPress: async () => {
          try {
            const result = await fakeApi.deleteTransaction(userId, actionTx.id);
            if (result.success) {
              // Optimize: Update local state immediately instead of refetching
              // Remove transaction from list
              setTransactions(prev => prev.filter(tx => tx.id !== actionTx.id));

              // Update wallet balance locally (add back the amount)
              const newBalance = selectedWallet.amount - actionTx.amount;
              const updatedWallet = { ...selectedWallet, amount: newBalance };

              setSelectedWallet(updatedWallet);
              setWallets(prev => prev.map(w =>
                w.id === selectedWallet.id ? updatedWallet : w
              ));

              setActionTx(null);
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa giao dịch');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        {/* App Bar */}
        <View style={[styles.appBar, { backgroundColor: theme.colors.surface, paddingTop: 0 }]}>
          <TouchableOpacity
            style={styles.walletSelector}
            onPress={() => setShowWalletModal(true)}
          >
            <Text style={[styles.walletTitle, { color: theme.colors.onSurface }]}>
              {selectedWallet?.name}
            </Text>
            <IconButton
              icon="chevron-down"
              size={20}
              iconColor={theme.colors.onSurface}
            />
          </TouchableOpacity>
        </View>
        {/* Current Balance Section */}
        <Card style={styles.balanceCard}>
          <Card.Content style={styles.balanceContent}>
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceLabel}>Số dư hiện tại:</Text>
              <Text style={[
                styles.balanceAmount,
                { color: currentBalance < 0 ? '#EF4444' : '#22C55E' }
              ]}>
                {balanceVisible ? formatCurrency(currentBalance) : '••••••'}
              </Text>
              <Text style={{ fontSize: 14, color: '#F97316', fontWeight: '600', marginTop: 4 }}>🔥 Streak: {userStreak} ngày</Text>
            </View>
            <View style={styles.balanceRight}>
              <IconButton
                icon={balanceVisible ? "eye" : "eye-off"}
                size={18}
                iconColor={theme.colors.onSurface}
                onPress={() => setBalanceVisible(!balanceVisible)}
              />

            </View>
          </Card.Content>
        </Card>


        {/* Transaction List */}
        <ScrollView>
          <View style={styles.transactionList}>
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <View key={date}>
                {/* Date Separator */}
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateText}>{date}</Text>
                </View>

                {/* Transactions for this date */}
                {transactions.map((transaction) => {
                  const category = getCategoryInfo(transaction.userCategoryId);
                  const isIncome = transaction.type === 1;

                  return (
                    <View key={transaction.id} style={styles.transactionItem}>

                      <Card style={styles.transactionCard}>
                        <Card.Content style={styles.transactionContent}>
                          <View style={styles.transactionLeft}>
                            <IconButton
                              icon="dots-vertical"
                              size={18}
                              iconColor="#6B7280"
                              onPress={() => openActions(transaction)}
                            />
                            <Text style={styles.transactionNote}>{transaction.note || transaction.content || ''}</Text>
                          </View>

                          <View style={styles.transactionRight}>
                            <View style={styles.categoryDisplay}>
                              <View style={[styles.categoryIconSmall, { backgroundColor: getIconColor(category.icon, appTheme) + '22' }]}>
                                <MaterialCommunityIcons 
                                  name={category.icon as any || 'tag-outline'} 
                                  size={14} 
                                  color={getIconColor(category.icon, appTheme)} 
                                />
                              </View>
                              <Text style={[styles.categoryNameText, { color: getIconColor(category.icon, appTheme) }]}>
                              {category.name}
                              </Text>
                            </View>

                            <Text style={[
                              styles.transactionAmount,
                              { color: isIncome ? '#22C55E' : '#EF4444' }
                            ]}>
                              {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </Text>
                          </View>
                        </Card.Content>
                      </Card>
                      <Avatar.Text
                        size={40}
                        label={initials}
                        style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                        color={theme.colors.onPrimary}
                      />

                    </View>

                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
        {/* Quick Input Bar */}

        {/* Thanh nhập nhanh luôn nổi ở đáy */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={{
            flex: 1,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <View style={[styles.quickInputBar, { backgroundColor: theme.colors.surface }]}>

            {quickFocused ? (
              <IconButton
                icon="chevron-right"
                size={18}
                iconColor="#64748B"
                style={styles.quickInputIcon}
                onPress={() => { setQuickFocused(false); quickInputRef.current?.blur(); }}
              />
            ) : (
              <>
                <IconButton
                  icon="plus-circle"
                  size={18}
                  iconColor="#22C55E"
                  style={styles.quickInputIcon}
                  onPress={handleAddTransaction}
                />
                <IconButton
                  icon="camera"
                  size={18}
                  iconColor="#64748B"
                  style={styles.quickInputIcon}
                  onPress={handleOCR}
                />
                <IconButton
                  icon="microphone"
                  size={18}
                  iconColor="#64748B"
                  style={styles.quickInputIcon}
                  onPress={handleVoice}
                />
              </>
            )}

            <TextInput
              ref={quickInputRef}
              style={[styles.quickInputField, quickFocused && { marginRight: 8 }]}
              placeholder="Nhập 'đi chơi 90k, cà phê 15k'"
              placeholderTextColor="#9CA3AF"
              value={quickInput}
              onChangeText={setQuickInput}
              multiline
              onFocus={() => setQuickFocused(true)}
              onBlur={() => setQuickFocused(false)}
              textAlignVertical="top"
            />

            <IconButton
              icon="send"
              size={18}
              iconColor="#22C55E"
              onPress={handleQuickInput}
            />
          </View>
        </KeyboardAvoidingView>

        {/* Wallet Selection Modal */}
        <Portal>
          <Modal
            visible={showWalletModal}
            onDismiss={() => setShowWalletModal(false)}
            contentContainerStyle={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Chọn ví</Text>
            <ScrollView>
              {(wallets).map((wallet) => (
                <List.Item
                  left={props => <List.Icon {...props} icon="wallet-outline" color={theme.colors.primary} />}
                  right={props => selectedWallet?.id === wallet.id ? <List.Icon {...props} icon="check" color={theme.colors.primary} /> : null}
                  key={wallet.id}
                  title={wallet.name}
                  description={`${formatCurrency(wallet.amount)} ${wallet.currency}`}
                  onPress={() => handleWalletSelect(wallet)}
                  style={styles.listItem}
                />
              ))}
            </ScrollView>
          </Modal>
        </Portal>

        {/* Actions Bottom Sheet */}
        <Portal>
          <Modal
            visible={showActionsSheet}
            onDismiss={() => setShowActionsSheet(false)}
            contentContainerStyle={[styles.sheetContainer]}
          >
            <Text style={styles.sheetTitle}>Thao tác</Text>
            <List.Item
              title="Chỉnh sửa"
              left={props => <List.Icon {...props} icon="pencil" />}
              onPress={openEdit}
            />
            <List.Item
              title="Xoá"
              left={props => <List.Icon {...props} icon="delete" />}
              onPress={confirmDelete}
            />
          </Modal>
        </Portal>

        {/* Edit Transaction Modal */}
        <TransactionModal
          visible={showEditSheet}
          mode="edit"
          transaction={actionTx}
          categories={categories}
          onDismiss={() => {
            setShowEditSheet(false);
            setActionTx(null);
          }}
          onSave={handleSaveEdit}
          loading={isLoading}
        />

        {/* Sao chép: đã loại bỏ theo yêu cầu */}


      </View >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  walletSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    margin: 16,
    marginBottom: 8,
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLeft: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  balanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsCard: {
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    borderRadius: 12,
  },
  analyzeButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#22C55E',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionList: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for quick input bar
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginLeft: 12,
  },
  transactionCard: {
    flex: 1,
    elevation: 1,
    borderRadius: 12,

  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  transactionLeft: {
    flex: 1,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  categoryNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionNote: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  quickInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickInputIcon: {
    marginRight: 0,
  },
  quickInputField: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 2,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listItem: {
    paddingHorizontal: 20,
  },
  walletColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  // bottom sheet base
  sheetContainer: {
    backgroundColor: 'white',
    marginTop: 'auto',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  fieldRow: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  categorySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categorySelectedText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  categoryPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  fieldInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

