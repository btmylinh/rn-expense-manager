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
  ActivityIndicator,
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
import DetectedTransactionsModal from '../../components/DetectedTransactionsModal';
import AIProcessingModal from '../../components/AIProcessingModal';
import VoiceGuideModal from '../../components/VoiceGuideModal';
import VoiceRecordingModal from '../../components/VoiceRecordingModal';
import OCRGuideModal from '../../components/OCRGuideModal';
import { getIconColor, useAppTheme } from '../../theme';
import * as ImagePicker from 'expo-image-picker';


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
  const [transactionGroups, setTransactionGroups] = useState<Array<{ date: string; transactions: any[] }>>([]);
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
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userStreak, setUserStreak] = useState(0);

  // detected transactions modal state
  const [showDetectedModal, setShowDetectedModal] = useState(false);
  const [detectedTransactions, setDetectedTransactions] = useState<any[]>([]);
  const [isParsingText, setIsParsingText] = useState(false);

  // voice modal state
  const [showVoiceGuideModal, setShowVoiceGuideModal] = useState(false);
  const [showVoiceRecordingModal, setShowVoiceRecordingModal] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // OCR modal state
  const [showOCRGuideModal, setShowOCRGuideModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

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
          // Update wallet info with current balance (API provides)
          setSelectedWallet(prev => prev ? { ...prev, amount: dashboard.data.wallet.balance } : null);
          // Set transaction groups (API calculates and groups by date)
          setTransactionGroups(dashboard.data.transactionGroups || []);
        }
      } catch { }
    })();
    return () => { mounted = false; };
  }, [selectedWallet?.id]); // Only depend on wallet ID to avoid infinite loops

  // Current balance from API (no calculation needed)
  const currentBalance = selectedWallet?.amount ?? 0;

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
        setIsParsingText(true);
        // Call AI API to parse text to transactions
        const parseResult = await fakeApi.parseTextToTransactions(userId, quickInput);
        
        if (parseResult.success && parseResult.transactions.length > 0) {
          // Show modal with detected transactions
          setDetectedTransactions(parseResult.transactions);
          setShowDetectedModal(true);
          setQuickInput('');
        } else {
          Alert.alert('Không phát hiện', 'Không thể phát hiện giao dịch từ tin nhắn của bạn.');
        }
      } catch (error) {
        Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý tin nhắn');
      } finally {
        setIsParsingText(false);
      }
    }
  };

  const handleOCR = () => {
    setShowOCRGuideModal(true);
  };

  const handleVoice = () => {
    setShowVoiceGuideModal(true);
  };

  const handleAddTransaction = () => {
    setShowAddSheet(true);
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

  const handleSaveAdd = useCallback(async (data: {
    amount: number;
    transactionDate: string;
    content: string;
    userCategoryId: number;
    type: number;
  }) => {
    if (!selectedWallet) return;
    setIsLoading(true);

    try {
      const result = await fakeApi.addTransaction(
        userId,
        selectedWallet.id,
        data.userCategoryId,
        data.amount,
        data.content,
        data.type,
        data.transactionDate
      );

      if (result.success) {
        // Reload data from API (API calculates everything)
        const dashboard = await fakeApi.getWalletDashboard(userId, selectedWallet.id);
        if (dashboard.success && dashboard.data) {
          setSelectedWallet(prev => prev ? { ...prev, amount: dashboard.data.wallet.balance } : null);
          setTransactionGroups(dashboard.data.transactionGroups || []);
        }

        setShowAddSheet(false);
        Alert.alert('Thành công', 'Đã thêm giao dịch mới');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi thêm giao dịch');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedWallet]);

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
        // Reload data from API (API calculates everything)
        const dashboard = await fakeApi.getWalletDashboard(userId, selectedWallet.id);
        if (dashboard.success && dashboard.data) {
          setSelectedWallet(prev => prev ? { ...prev, amount: dashboard.data.wallet.balance } : null);
          setTransactionGroups(dashboard.data.transactionGroups || []);
        }

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
              // Reload data from API (API calculates everything)
              const dashboard = await fakeApi.getWalletDashboard(userId, selectedWallet.id);
              if (dashboard.success && dashboard.data) {
                setSelectedWallet(prev => prev ? { ...prev, amount: dashboard.data.wallet.balance } : null);
                setTransactionGroups(dashboard.data.transactionGroups || []);
              }

              setActionTx(null);
            }
          } catch (error) {
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi xóa giao dịch');
          }
        }
      }
    ]);
  };

  // Detected transactions modal handlers
  const handleCategoryChange = (transactionId: number | string, categoryId: number) => {
    setDetectedTransactions(prev =>
      prev.map(tx =>
        tx.id === transactionId
          ? { ...tx, categoryId, category: categories.find(c => c.id === categoryId) }
          : tx
      )
    );
  };

  const handleDeleteDetected = (transactionId: number | string) => {
    setDetectedTransactions(prev => prev.filter(tx => tx.id !== transactionId));
  };

  const handleTransactionUpdate = (transactionId: number | string, updatedData: any) => {
    setDetectedTransactions(prev =>
      prev.map(tx =>
        tx.id === transactionId ? { ...tx, ...updatedData } : tx
      )
    );
  };

  const handleEditDetected = (transaction: any) => {
    // Convert to TransactionModal format and open edit sheet
    setActionTx({
      id: transaction.id as number,
      userId,
      walletId: selectedWallet?.id || 1,
      userCategoryId: transaction.categoryId,
      amount: transaction.amount,
      transactionDate: transaction.date,
      content: transaction.description,
      type: transaction.type,
      createdAt: new Date().toISOString(),
    });
    setShowDetectedModal(false);
    setShowEditSheet(true);
  };

  const handleSaveDetected = async () => {
    if (!selectedWallet || detectedTransactions.length === 0) return;

    try {
      setIsLoading(true);
      
      // Create all transactions
      const createPromises = detectedTransactions.map(tx =>
        fakeApi.addTransaction(
          userId,
          selectedWallet.id,
          tx.categoryId,
          Math.abs(tx.amount),
          tx.description,
          tx.type,
          tx.date
        )
      );

      await Promise.all(createPromises);

      // Reload data from API
      const dashboard = await fakeApi.getWalletDashboard(userId, selectedWallet.id);
      if (dashboard.success && dashboard.data) {
        setSelectedWallet(prev => prev ? { ...prev, amount: dashboard.data.wallet.balance } : null);
        setTransactionGroups(dashboard.data.transactionGroups || []);
      }

      Alert.alert('Thành công', `Đã lưu ${detectedTransactions.length} giao dịch`);
      setShowDetectedModal(false);
      setDetectedTransactions([]);
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu giao dịch');
    } finally {
      setIsLoading(false);
    }
  };

  // Voice handlers
  const handleStartRecording = () => {
    setShowVoiceGuideModal(false);
    setShowVoiceRecordingModal(true);
  };

  const handleSendVoice = async () => {
    setShowVoiceRecordingModal(false);
    setIsProcessingVoice(true);

    try {
      // Call fake API to process voice
      const parseResult = await fakeApi.parseVoiceToTransactions(userId);
      
      if (parseResult.success && parseResult.transactions.length > 0) {
        // Show modal with detected transactions
        setDetectedTransactions(parseResult.transactions);
        setShowDetectedModal(true);
      } else {
        Alert.alert('Không phát hiện', 'Không thể phát hiện giao dịch từ giọng nói của bạn.');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý giọng nói');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // OCR handlers
  const handleCaptureImage = async () => {
    setShowOCRGuideModal(false);
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập camera để chụp ảnh.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Send image directly for processing
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở camera. Vui lòng thử lại.');
      console.error('Camera error:', error);
    }
  };

  const handlePickFromLibrary = async () => {
    setShowOCRGuideModal(false);
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.');
        return;
      }

      // Launch image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Send image directly for processing
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh. Vui lòng thử lại.');
      console.error('Image library error:', error);
    }
  };

  const handleSendImage = async (imageUri: string) => {
    if (!imageUri) return;
    
    // Set image for preview in AIProcessingModal
    setSelectedImage(imageUri);
    // Show processing modal with image preview
    setIsProcessingImage(true);

    try {
      // Call fake API to process image (simulates 3-5 seconds delay)
      const parseResult = await fakeApi.parseImageToTransactions(userId, imageUri);
      
      // Close processing modal
      setIsProcessingImage(false);
      
      if (parseResult.success && parseResult.transactions.length > 0) {
        // Show modal with detected transactions
        setDetectedTransactions(parseResult.transactions);
        setShowDetectedModal(true);
        // Clear image after showing results
        setSelectedImage(null);
      } else {
        Alert.alert('Không phát hiện', 'Không thể phát hiện giao dịch từ ảnh của bạn.');
        setSelectedImage(null);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi xử lý ảnh');
      setIsProcessingImage(false);
      setSelectedImage(null);
    }
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
            {transactionGroups.map((group) => (
              <View key={group.date}>
                {/* Date Separator */}
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateText}>{group.date}</Text>
                </View>

                {/* Transactions for this date */}
                {group.transactions.map((transaction) => {
                  const category = transaction.category || getCategoryInfo(transaction.userCategoryId);
                  const isIncome = transaction.type === 1 || transaction.type === 'income';

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

            {isParsingText ? (
              <ActivityIndicator size="small" color="#22C55E" style={{ marginRight: 8 }} />
            ) : (
              <IconButton
                icon="send"
                size={18}
                iconColor="#22C55E"
                onPress={handleQuickInput}
                disabled={isParsingText}
              />
            )}
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

        {/* Add Transaction Modal */}
        <TransactionModal
          visible={showAddSheet}
          mode="add"
          transaction={null}
          categories={categories}
          onDismiss={() => {
            setShowAddSheet(false);
          }}
          onSave={handleSaveAdd}
          loading={isLoading}
        />

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

        {/* Detected Transactions Modal */}
        <DetectedTransactionsModal
          visible={showDetectedModal}
          onDismiss={() => {
            setShowDetectedModal(false);
            setDetectedTransactions([]);
          }}
          transactions={detectedTransactions}
          categories={categories}
          onCategoryChange={handleCategoryChange}
          onDelete={handleDeleteDetected}
          onEdit={handleEditDetected}
          onSave={handleSaveDetected}
          onTransactionUpdate={handleTransactionUpdate}
          userId={userId}
          walletId={selectedWallet?.id}
          loading={isLoading}
        />

        {/* AI Processing Modal */}
        <AIProcessingModal
          visible={isParsingText || isProcessingVoice || isProcessingImage}
          type={
            isProcessingImage 
              ? 'image' 
              : isProcessingVoice 
              ? 'voice' 
              : 'text'
          }
          imageUri={isProcessingImage ? selectedImage : undefined}
          onRequestClose={() => {
            // Optional: Allow user to cancel processing
            // setIsParsingText(false);
          }}
        />

        {/* Voice Guide Modal */}
        <VoiceGuideModal
          visible={showVoiceGuideModal}
          onDismiss={() => setShowVoiceGuideModal(false)}
          onStart={handleStartRecording}
        />

        {/* Voice Recording Modal */}
        <VoiceRecordingModal
          visible={showVoiceRecordingModal}
          onDismiss={() => setShowVoiceRecordingModal(false)}
          onSend={handleSendVoice}
          onCancel={() => {
            setShowVoiceRecordingModal(false);
            setShowVoiceGuideModal(true);
          }}
        />

        {/* OCR Guide Modal */}
        <OCRGuideModal
          visible={showOCRGuideModal}
          onDismiss={() => setShowOCRGuideModal(false)}
          onCapture={handleCaptureImage}
          onPickFromLibrary={handlePickFromLibrary}
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


