import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
import { fakeApi } from '../../services/fakeApi';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [quickInput, setQuickInput] = useState('');

  // actions state
  const [actionTx, setActionTx] = useState<Transaction | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showCopySheet, setShowCopySheet] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [copyAmount, setCopyAmount] = useState('');
  const [copyDate, setCopyDate] = useState('');
  const [copyNote, setCopyNote] = useState('');
  const [copyCategoryId, setCopyCategoryId] = useState<number | null>(null);
  const [copyType, setCopyType] = useState<'income' | 'expense'>('expense');
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showCopyCategoryModal, setShowCopyCategoryModal] = useState(false);
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [showCopyDateModal, setShowCopyDateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userStreak, setUserStreak] = useState(0);

  const userId = 1;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [w, c, s] = await Promise.all([
          fakeApi.getWallets(userId),
          fakeApi.getUserCategories(userId),
          fakeApi.getUserStreak(userId),
        ]);
        if (!mounted) return;
        setWallets(w as any);
        setSelectedWallet((w as any)[0] ?? null);
        setCategories(c as any);
        if ((s as any)?.success) setUserStreak((s as any).streak || 0);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // Load transactions when selected wallet changes
  useEffect(() => {
    if (!selectedWallet) return;
    
    let mounted = true;
    (async () => {
      try {
        const t = await fakeApi.getTransactions(userId, selectedWallet.id);
        if (!mounted) return;
        setTransactions((t as any).map((tx: any) => ({ ...tx, note: tx.content })));
      } catch {}
    })();
    return () => { mounted = false; };
  }, [selectedWallet]);

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
    return amount.toLocaleString('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + '₫';
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

  const getCategoryInfo = (categoryId: number) => {
    const fallback: Category = { id: 0, name: 'Khác', type: 2, icon: 'tag-outline', color: '#64748B' };
    return categories.find(cat => cat.id === categoryId) || fallback;
  };

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
    setEditAmount(formatNumberInput(String(Math.abs(actionTx.amount))));
    setEditDate(actionTx.transactionDate);
    setEditNote((actionTx.note || '').slice(0, 250));
    setEditCategoryId(actionTx.userCategoryId);
    setEditType(actionTx.type === 1 ? 'income' : 'expense');
    setShowActionsSheet(false);
    setShowEditSheet(true);
  };

  const saveEdit = useCallback(async () => {
    if (!actionTx || !selectedWallet) return;
    const amt = parseFormattedNumber(editAmount);
    
    if (amt <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await fakeApi.updateTransaction(userId, actionTx.id, {
        amount: editType === 'income' ? Math.abs(amt) : -Math.abs(amt),
        transactionDate: editDate,
        content: (editNote || '').slice(0, 250),
        userCategoryId: editCategoryId ?? actionTx.userCategoryId,
        type: editType === 'income' ? 1 : 2,
      });
      
      if (result.success) {
        // Optimize: Update local state immediately instead of refetching
        const updatedTransaction = {
          ...actionTx,
          amount: editType === 'income' ? Math.abs(amt) : -Math.abs(amt),
          transactionDate: editDate,
          content: (editNote || '').slice(0, 250),
          note: (editNote || '').slice(0, 250),
          userCategoryId: editCategoryId ?? actionTx.userCategoryId,
          type: editType === 'income' ? 1 : 2,
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
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật giao dịch');
    } finally {
      setIsLoading(false);
    }
  }, [actionTx, selectedWallet, editAmount, editDate, editNote, editCategoryId, editType]);

  const openCopy = () => {
    if (!actionTx) return;
    setCopyAmount(formatNumberInput(String(Math.abs(actionTx.amount))));
    setCopyDate(actionTx.transactionDate);
    setCopyNote((actionTx.note || '').slice(0, 250));
    setCopyCategoryId(actionTx.userCategoryId);
    setCopyType(actionTx.type === 1 ? 'income' : 'expense');
    setShowActionsSheet(false);
    setShowCopySheet(true);
  };

  const saveCopy = useCallback(async () => {
    if (!actionTx || !selectedWallet) return;
    const amt = parseFormattedNumber(copyAmount);
    
    if (amt <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await fakeApi.createTransaction(userId, {
        walletId: selectedWallet.id,
        userCategoryId: copyCategoryId ?? actionTx.userCategoryId,
        amount: copyType === 'income' ? Math.abs(amt) : -Math.abs(amt),
        content: (copyNote || '').slice(0, 250),
        type: copyType === 'income' ? 1 : 2,
        transactionDate: copyDate,
      });
      
      if (result.success) {
        // Optimize: Update local state immediately instead of refetching
        const newTransaction = {
          id: result.transaction?.id || Date.now(), // Use returned ID or fallback
          userId: userId,
          walletId: selectedWallet.id,
          userCategoryId: copyCategoryId ?? actionTx.userCategoryId,
          amount: copyType === 'income' ? Math.abs(amt) : -Math.abs(amt),
          content: (copyNote || '').slice(0, 250),
          note: (copyNote || '').slice(0, 250),
          transactionDate: copyDate,
          type: copyType === 'income' ? 1 : 2,
          createdAt: new Date().toISOString(),
        };
        
        // Add new transaction to the list
        setTransactions(prev => [newTransaction, ...prev]);
        
        // Update wallet balance locally
        const newBalance = selectedWallet.amount + newTransaction.amount;
        const updatedWallet = { ...selectedWallet, amount: newBalance };
        
        setSelectedWallet(updatedWallet);
        setWallets(prev => prev.map(w => 
          w.id === selectedWallet.id ? updatedWallet : w
        ));
        
        setShowCopySheet(false);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo giao dịch');
    } finally {
      setIsLoading(false);
    }
  }, [actionTx, selectedWallet, copyAmount, copyDate, copyNote, copyCategoryId, copyType]);

  const confirmDelete = () => {
    setShowActionsSheet(false);
    if (!actionTx || !selectedWallet) return;
    Alert.alert('Xoá giao dịch', 'Bạn có chắc muốn xoá giao dịch này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: async () => {
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
      }}
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <View style={{ flex: 1 }}>
      {/* App Bar */}
      <View style={[styles.appBar, { backgroundColor: theme.colors.surface, paddingTop: 0 }]}>
        <TouchableOpacity
          style={styles.walletSelector}
          onPress={() => setShowWalletModal(true)}
        >
          <Text style={[styles.walletTitle, { color: theme.colors.onSurface }]}>
            {selectedWallet?.name || 'Chọn ví'}
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Transaction List */}
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
                        <Chip
                            mode="outlined"
                            style={[styles.categoryChip, { borderColor: category.color || '#64748B' }]}
                            textStyle={[styles.categoryText, { color: category.color || '#64748B' }]}
                          >
                            {category.name}
                          </Chip>
                          
                          <Text style={[
                            styles.transactionAmount,
                            { color: isIncome ? '#22C55E' : '#EF4444' }
                          ]}>
                            {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </Text>
                        </View>
                      </Card.Content>
                    </Card>
                    <Avatar.Image
                      size={40}
                      source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
                      style={styles.avatar}
                    />
                    
                  </View>
                  
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Quick Input Bar */}
      <View style={[styles.quickInputBar, { backgroundColor: theme.colors.surface }]}>
        <IconButton
          icon="plus-circle"
          size={22}
          iconColor="#22C55E"
          style={styles.quickInputIcon}
          onPress={handleAddTransaction}
        />
        
        <IconButton
          icon="camera"
          size={22}
          iconColor="#64748B"
          style={styles.quickInputIcon}
          onPress={handleOCR}
        />
        
        <IconButton
          icon="microphone"
          size={22}
          iconColor="#64748B"
          style={styles.quickInputIcon}
          onPress={handleVoice}
        />
        
        <TextInput
          style={styles.quickInputField}
          placeholder="Nhập 'đi chơi 90k, cà phê 15k'"
          placeholderTextColor="#9CA3AF"
          value={quickInput}
          onChangeText={setQuickInput}
          multiline
        />
        
        <IconButton
          icon="send"
          size={22}
          iconColor="#22C55E"
          onPress={handleQuickInput}
        />
      </View>

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
                key={wallet.id}
                title={wallet.name}
                description={`${formatCurrency(wallet.amount)} ${wallet.currency}`}
                left={() => (
                  <View style={[styles.walletColor, { backgroundColor: wallet.color }]} />
                )}
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
            title="Sao chép"
            left={props => <List.Icon {...props} icon="content-copy" />}
            onPress={openCopy}
          />
          <List.Item
            title="Xoá"
            left={props => <List.Icon {...props} icon="delete" />}
            onPress={confirmDelete}
          />
        </Modal>
      </Portal>

      {/* Edit Bottom Sheet */}
      <Portal>
        <Modal
          visible={showEditSheet}
          onDismiss={() => setShowEditSheet(false)}
          contentContainerStyle={[styles.sheetContainer]}
        >
          <Text style={styles.editTitle}>Chỉnh sửa giao dịch</Text>
          <SegmentedButtons
            value={editType}
            onValueChange={(v: any) => setEditType(v)}
            buttons={[
              { value: 'expense', label: 'Chi', icon: 'minus' },
              { value: 'income', label: 'Thu', icon: 'plus' },
            ]}
            style={{ marginBottom: 12 }}
          />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Số tiền</Text>
            <TextInput
              value={editAmount}
              onChangeText={(text) => setEditAmount(formatNumberInput(text))}
              keyboardType="numeric"
              style={styles.fieldInput}
              placeholder="Nhập số tiền (VD: 1,000)"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ngày</Text>
            <PaperTextInput
              value={editDate}
              onChangeText={setEditDate}
              style={styles.fieldInput}
              placeholder="YYYY-MM-DD"
              onFocus={() => setShowEditDateModal(true)}
              right={<PaperTextInput.Icon icon="calendar" onPress={() => setShowEditDateModal(true)} />}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nội dung giao dịch</Text>
            <TextInput
              value={editNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onChangeText={(t) => setEditNote((t || '').slice(0, 250))}
              style={[styles.fieldInput, { minHeight: 96 }]}
              placeholder="Nhập ghi chú"
            />
            <Text style={{ textAlign: 'right', color: '#6B7280', marginTop: 4 }}>{editNote.length}/250</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Danh mục</Text>
            <Button mode="outlined" onPress={() => setShowEditCategoryModal(true)}>
              {(() => {
                const cat = categories.find(c => c.id === editCategoryId);
                return cat ? cat.name : 'Chọn danh mục';
              })()}
            </Button>
          </View>
          <View style={styles.sheetActions}>
            <Button mode="outlined" onPress={() => setShowEditSheet(false)} disabled={isLoading}>Huỷ</Button>
            <Button mode="contained" onPress={saveEdit} loading={isLoading} disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Copy Modal */}
      <Portal>
        <Modal
          visible={showCopySheet}
          onDismiss={() => setShowCopySheet(false)}
          contentContainerStyle={[styles.modalContent]}
        >
          <Text style={styles.modalTitle}>Thêm giao dịch từ bản sao</Text>
          <SegmentedButtons
            value={copyType}
            onValueChange={(v: any) => setCopyType(v)}
            buttons={[
              { value: 'expense', label: 'Chi', icon: 'minus' },
              { value: 'income', label: 'Thu', icon: 'plus' },
            ]}
            style={{ marginBottom: 12 }}
          />
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Số tiền</Text>
            <TextInput
              value={copyAmount}
              onChangeText={(text) => setCopyAmount(formatNumberInput(text))}
              keyboardType="numeric"
              style={styles.fieldInput}
              placeholder="Nhập số tiền (VD: 1,000)"
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ngày</Text>
            <PaperTextInput
              value={copyDate}
              onChangeText={setCopyDate}
              style={styles.fieldInput}
              placeholder="YYYY-MM-DD"
              onFocus={() => setShowCopyDateModal(true)}
              right={<PaperTextInput.Icon icon="calendar" onPress={() => setShowCopyDateModal(true)} />}
            />
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nội dung (tối đa 250 ký tự)</Text>
            <TextInput
              value={copyNote}
              onChangeText={(t) => setCopyNote((t || '').slice(0, 250))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.fieldInput, { minHeight: 96 }]}
              placeholder="Nhập nội dung"
            />
            <Text style={{ textAlign: 'right', color: '#6B7280', marginTop: 4 }}>{copyNote.length}/250</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Danh mục</Text>
            <Button mode="outlined" onPress={() => setShowCopyCategoryModal(true)}>
              {(() => {
                const cat = categories.find(c => c.id === copyCategoryId);
                return cat ? cat.name : 'Chọn danh mục';
              })()}
            </Button>
          </View>
          <View style={styles.sheetActions}>
            <Button mode="outlined" onPress={() => setShowCopySheet(false)} disabled={isLoading}>Huỷ</Button>
            <Button mode="contained" onPress={saveCopy} loading={isLoading} disabled={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Edit Category Select */}
      <Portal>
        <Modal visible={showEditCategoryModal} onDismiss={() => setShowEditCategoryModal(false)} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn danh mục</Text>
          <ScrollView>
            {(categories.filter(c => (editType === 'income' ? c.type === 1 : c.type === 2))).map(cat => (
              <List.Item
                key={cat.id}
                title={cat.name}
                onPress={() => { setEditCategoryId(cat.id); setShowEditCategoryModal(false); }}
                left={props => <List.Icon {...props} icon="folder" color={cat.color} />}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Copy Category Select */}
      <Portal>
        <Modal visible={showCopyCategoryModal} onDismiss={() => setShowCopyCategoryModal(false)} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn danh mục</Text>
          <ScrollView>
            {(categories.filter(c => (copyType === 'income' ? c.type === 1 : c.type === 2))).map(cat => (
              <List.Item
                key={cat.id}
                title={cat.name}
                onPress={() => { setCopyCategoryId(cat.id); setShowCopyCategoryModal(false); }}
                left={props => <List.Icon {...props} icon="folder" color={cat.color} />}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Simple Date pickers (manual) */}
      <Portal>
        <Modal visible={showEditDateModal} onDismiss={() => setShowEditDateModal(false)} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn ngày</Text>
          <List.Item title="Hôm nay" onPress={() => { setEditDate(new Date().toISOString().slice(0,10)); setShowEditDateModal(false); }} left={p => <List.Icon {...p} icon="calendar-today" />} />
          <List.Item title="Hôm qua" onPress={() => { const d=new Date(); d.setDate(d.getDate()-1); setEditDate(d.toISOString().slice(0,10)); setShowEditDateModal(false); }} left={p => <List.Icon {...p} icon="calendar" />} />
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <TextInput value={editDate} onChangeText={setEditDate} placeholder="YYYY-MM-DD" style={styles.fieldInput} />
            <View style={styles.sheetActions}>
              <Button mode="outlined" onPress={() => setShowEditDateModal(false)}>Đóng</Button>
              <Button mode="contained" onPress={() => setShowEditDateModal(false)}>Chọn</Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <Portal>
        <Modal visible={showCopyDateModal} onDismiss={() => setShowCopyDateModal(false)} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn ngày</Text>
          <List.Item title="Hôm nay" onPress={() => { setCopyDate(new Date().toISOString().slice(0,10)); setShowCopyDateModal(false); }} left={p => <List.Icon {...p} icon="calendar-today" />} />
          <List.Item title="Hôm qua" onPress={() => { const d=new Date(); d.setDate(d.getDate()-1); setCopyDate(d.toISOString().slice(0,10)); setShowCopyDateModal(false); }} left={p => <List.Icon {...p} icon="calendar" />} />
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <TextInput value={copyDate} onChangeText={setCopyDate} placeholder="YYYY-MM-DD" style={styles.fieldInput} />
            <View style={styles.sheetActions}>
              <Button mode="outlined" onPress={() => setShowCopyDateModal(false)}>Đóng</Button>
              <Button mode="contained" onPress={() => setShowCopyDateModal(false)}>Chọn</Button>
            </View>
          </View>
        </Modal>
      </Portal>

      </View>
    </KeyboardAvoidingView>
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
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  categoryText: {
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickInputIcon: {
    marginRight: 8,
  },
  quickInputField: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 80,
    marginRight: 8,
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

