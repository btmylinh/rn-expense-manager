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
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { DatePickerModal } from 'react-native-paper-dates';
import CategorySelectModal from '../../components/CategorySelectModal';
import TransactionModal from '../../components/TransactionModal';
import DetectedTransactionsModal from '../../components/DetectedTransactionsModal';
import AIProcessingModal from '../../components/AIProcessingModal';
import VoiceGuideModal from '../../components/VoiceGuideModal';
import VoiceRecordingModal from '../../components/VoiceRecordingModal';
import OCRGuideModal from '../../components/OCRGuideModal';
import WalletSelectModal from '../../components/WalletSelectModal';
import { getIconColor, useAppTheme } from '../../theme';
import { useMetadata } from '../../contexts/MetadataContext';
import { transactionApi } from '../../api/transactionApi';
import { walletApi } from '../../api/walletApi';
import { getErrorMessage } from '../../utils/errorHandler';
// Trigger tự động xử lý streak khi có transaction, không cần import triggerStreakActivity
import { useNotifications } from '../../contexts/NotificationContext';
import { aiApi } from '../../api/aiApi';
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
  userId?: number;
  name: string;
  amount?: number;
  currency?: string;
  color?: string;
  is_default?: number | boolean;
  [key: string]: any;
}

interface Category {
  id: number;
  userId?: number;
  name: string;
  type?: number; // 1 income, 2 expense
  icon?: string;
  color?: string;
}

const AI_PARSING_AVAILABLE = false;

export default function AddTransactionScreen() {
  const theme = useTheme();
  const appTheme = useAppTheme();
  const [userName, setUserName] = useState<string>('');
  const [transactionGroups, setTransactionGroups] = useState<Array<{ date: string; transactions: any[] }>>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [quickFocused, setQuickFocused] = useState(false);
  const quickInputRef = useRef<TextInput>(null);
  const transactionsCacheRef = useRef<any[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  // Track thời gian tạo giao dịch mới (để hiển thị badge)
  const [newTransactionTime, setNewTransactionTime] = useState<number>(Date.now());

  // actions state
  const [actionTx, setActionTx] = useState<Transaction | null>(null);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const { user } = useAuth();
  const userId = user?.id;
  const { refreshNotifications } = useNotifications();
  const { wallets, categories, ensureWallets, ensureCategories, refreshWallets, refreshCategories, defaultWallet } = useMetadata();
  const modalCategories = React.useMemo(
    () =>
      categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        type: cat.type ?? 2,
      })),
    [categories]
  );

  const resolveCategory = useCallback(
    (categoryId: number) => {
      return (
        categories.find(c => c.id === categoryId) || {
          id: categoryId,
          name: 'Chưa phân loại',
          icon: 'tag-outline',
          type: 2,
        }
      );
    },
    [categories]
  );

  const groupTransactionsByDateRef = useRef<((transactions: any[]) => void) | undefined>(undefined);

  const groupTransactionsByDate = useCallback(
    (transactions: any[]) => {
      transactionsCacheRef.current = transactions;
      const groups = new Map<
        string,
        { label: string; total: number; items: Array<Record<string, any>> }
      >();

      transactions.forEach(rawTx => {
        const createdAtValue =
          rawTx.created_at ??
          rawTx.createdAt ??
          rawTx.transaction_date ??
          rawTx.transactionDate;
        const date = createdAtValue ? new Date(createdAtValue) : new Date();
        if (Number.isNaN(date.getTime())) {
          return;
        }
        const isoDate = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        const normalized = {
          id: rawTx.id,
          userId: rawTx.user_id ?? rawTx.userId,
          walletId: rawTx.wallet_id ?? rawTx.walletId,
          userCategoryId: rawTx.user_category_id ?? rawTx.userCategoryId,
          amount: Number(rawTx.amount),
          note: rawTx.note,
          content: rawTx.content,
          transactionDate: rawTx.transaction_date ?? rawTx.transactionDate,
          type: rawTx.type,
          createdAt: createdAtValue ?? new Date().toISOString(),
          category: resolveCategory(rawTx.user_category_id ?? rawTx.userCategoryId),
        };

        const entry = groups.get(isoDate) || { label, total: 0, items: [] };
        entry.items.push(normalized);
        entry.total += normalized.type === 1 ? normalized.amount : -normalized.amount;
        groups.set(isoDate, entry);
      });

      const formatted = Array.from(groups.entries())
        .sort((a, b) => (a[0] > b[0] ? 1 : -1)) // Mới nhất ở cuối (như tin nhắn)
        .map(([, value]) => ({
          date: value.label,
          total: value.total,
          transactions: value.items.sort((a, b) => {
            // Sắp xếp trong mỗi ngày: mới nhất ở cuối
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeA > timeB ? 1 : -1;
          }),
        }));

      setTransactionGroups(formatted);
    },
    [resolveCategory]
  );
  
  // Cập nhật ref mỗi khi function thay đổi
  useEffect(() => {
    groupTransactionsByDateRef.current = groupTransactionsByDate;
  }, [groupTransactionsByDate]);

  useEffect(() => {
    if (!transactionGroups.length) return;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    });
  }, [transactionGroups]);

  const [loadingWalletOverview, setLoadingWalletOverview] = useState(false);
  const [walletOverviewError, setWalletOverviewError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadWalletOverview = useCallback(
    async (walletId: number) => {
      // Tránh gọi API nếu đang loading
      if (loadingRef.current) {
        return;
      }
      
      try {
        loadingRef.current = true;
        setLoadingWalletOverview(true);
        setWalletOverviewError(null);
        
        const [walletResponse, transactionsResponse] = await Promise.all([
          walletApi.getWalletById(walletId),
          transactionApi.getTransactions({
            wallet_id: walletId,
            limit: 200,
            sortBy: 'created_at',
            sortOrder: 'DESC',
          }),
        ]);

        const walletData = walletResponse.data?.wallet || walletResponse.data?.data?.wallet;
        if (walletData) {
          setSelectedWallet(prev => (prev ? { ...prev, amount: walletData.amount, currency: walletData.currency } : walletData));
        }

        const txs =
          transactionsResponse.data?.data?.transactions ||
          transactionsResponse.data?.transactions ||
          [];
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentTxs = txs
          .map((tx: any) => ({
            ...tx,
            __createdAt:
              tx.created_at ??
              tx.createdAt ??
              tx.transaction_date ??
              tx.transactionDate,
          }))
          .filter((tx: any) => {
            if (!tx.__createdAt) return true;
            const time = new Date(tx.__createdAt).getTime();
            if (Number.isNaN(time)) return true;
            return time >= oneWeekAgo;
          })
          .sort((a: any, b: any) => {
            const timeA = new Date(a.__createdAt ?? a.created_at ?? a.createdAt ?? a.transaction_date).getTime();
            const timeB = new Date(b.__createdAt ?? b.created_at ?? b.createdAt ?? b.transaction_date).getTime();
            return timeA - timeB;
          })
          .map(({ __createdAt, ...rest }: any) => rest);
        // Sử dụng ref để tránh dependency loop
        if (groupTransactionsByDateRef.current) {
          groupTransactionsByDateRef.current(recentTxs);
        }
      } catch (error) {
        console.error('Failed to load wallet overview', error);
        setWalletOverviewError('Không thể tải giao dịch');
        // Không retry tự động khi lỗi
      } finally {
        loadingRef.current = false;
        setLoadingWalletOverview(false);
        }
    },
    [] // Không có dependency để tránh re-create function
  );

  useEffect(() => {
    if (transactionsCacheRef.current.length > 0) {
      groupTransactionsByDate(transactionsCacheRef.current);
    }
  }, [groupTransactionsByDate]);

  const refreshAfterMutation = useCallback(
    async (walletId?: number | null) => {
      if (walletId) {
        await loadWalletOverview(walletId);
      }
      refreshWallets().catch(() => undefined);
      refreshNotifications().catch(() => undefined);
    },
    [loadWalletOverview, refreshNotifications, refreshWallets]
  );

  useEffect(() => {
    if (!wallets.length) {
      setSelectedWallet(null);
      return;
    }
    setSelectedWallet(prev => {
      if (prev) {
        const updated = wallets.find(w => w.id === prev.id);
        if (updated) {
          return { ...prev, ...updated };
        }
      }
      const fallback = defaultWallet ?? wallets[0];
      return fallback ? { ...fallback } : null;
    });
  }, [wallets, defaultWallet]);

  // Chỉ load một lần khi mount, không depend vào ensureWallets/ensureCategories
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      ensureWallets().catch(() => undefined);
      ensureCategories().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi mount

  useEffect(() => {
    if (user?.name) {
      setUserName(user.name);
    } else if (user?.email) {
      setUserName(user.email.split('@')[0]);
    } else {
      setUserName('Người dùng');
    }
  }, [user]);

  // Refresh wallets and categories whenever returning to this screen (chỉ refresh khi cần)
  const lastRefreshRef = useRef<number>(0);
  const REFRESH_INTERVAL = 5000; // 5 giây
  
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const now = Date.now();
      // Chỉ refresh nếu đã qua 5 giây kể từ lần refresh cuối
      if (now - lastRefreshRef.current < REFRESH_INTERVAL) {
        return;
      }
      
      (async () => {
        try {
          lastRefreshRef.current = now;
          const [walletList] = await Promise.all([refreshWallets(), refreshCategories()]);
          if (!active) return;
          const list = Array.isArray(walletList) ? walletList : [];
          setSelectedWallet(prev => {
            if (prev) {
              const updated = list.find((w: any) => w.id === prev.id);
              if (updated) {
                return { ...prev, ...updated };
              }
            }
            const fallback =
              list.find((w: any) => w.isDefault || w.is_default === 1) ||
              list[0] ||
              defaultWallet ||
              null;
            return fallback ? { ...fallback } : null;
          });
        } catch (error) {
          console.error('Failed to refresh wallets/categories', error);
        }
      })();
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Không depend vào refreshWallets/refreshCategories để tránh loop
  );

  // Load wallet dashboard when selected wallet changes
  useEffect(() => {
    if (!selectedWallet?.id) {
      setTransactionGroups([]);
      return;
    }
    // Reset error khi wallet thay đổi
    setWalletOverviewError(null);
    // Load wallet overview
    loadWalletOverview(selectedWallet.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWallet?.id]); // Chỉ depend vào selectedWallet.id để tránh loop

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

  const handleWalletSelectById = (walletId: number | null) => {
    if (walletId == null) return;
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      handleWalletSelect(wallet);
    } else {
      setShowWalletModal(false);
    }
  };

  const handleQuickInput = async () => {
    if (!quickInput.trim()) return;
    if (!selectedWallet?.id) {
      Alert.alert('Thông báo', 'Vui lòng chọn ví trước');
      return;
    }
    
    const text = quickInput.trim();
          setQuickInput('');
    await processTextToTransactions(text);
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
      await transactionApi.createTransaction({
        wallet_id: selectedWallet.id,
        user_category_id: data.userCategoryId,
        amount: Math.abs(data.amount),
        type: data.type as 1 | 2,
        transaction_date: data.transactionDate,
        content: data.content,
      });

      await refreshAfterMutation(selectedWallet.id);
      // Trigger tự động xử lý streak khi có transaction, không cần gọi API activate

      // Đánh dấu thời gian tạo giao dịch mới (để hiển thị badge)
      setNewTransactionTime(Date.now());

        setShowAddSheet(false);
        Alert.alert('Thành công', 'Đã thêm giao dịch mới');
    } catch (error: any) {
      Alert.alert('Lỗi', getErrorMessage(error, 'Có lỗi xảy ra khi thêm giao dịch'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [refreshAfterMutation, selectedWallet]);

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
      await transactionApi.updateTransaction(actionTx.id, {
        user_category_id: data.userCategoryId,
        amount: Math.abs(data.amount),
        type: data.type as 1 | 2,
        transaction_date: data.transactionDate,
        content: data.content,
        wallet_id: selectedWallet.id,
      });

      await refreshAfterMutation(selectedWallet.id);
      // Trigger tự động xử lý streak khi có transaction, không cần gọi API activate

        setShowEditSheet(false);
        setActionTx(null);
    } catch (error: any) {
      Alert.alert('Lỗi', getErrorMessage(error, 'Có lỗi xảy ra khi cập nhật giao dịch'));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [actionTx, refreshAfterMutation, selectedWallet]);

  const confirmDelete = () => {
    setShowActionsSheet(false);
    if (!actionTx || !selectedWallet) return;
    Alert.alert('Xoá giao dịch', 'Bạn có chắc muốn xoá giao dịch này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xoá', style: 'destructive', onPress: async () => {
          try {
            await transactionApi.deleteTransaction(actionTx.id);
            await refreshAfterMutation(selectedWallet.id);
              setActionTx(null);
          } catch (error: any) {
            Alert.alert('Lỗi', getErrorMessage(error, 'Có lỗi xảy ra khi xóa giao dịch'));
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
    if (!userId) return;
    // Convert to TransactionModal format and open edit sheet
    setActionTx({
      id: transaction.id as number,
      userId,
      walletId: selectedWallet?.id ?? 0,
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
      const results = await Promise.all(
        detectedTransactions.map(tx =>
          transactionApi.createTransaction({
            wallet_id: selectedWallet.id,
            user_category_id: tx.categoryId,
            amount: Math.abs(tx.amount),
            type: tx.type as 1 | 2,
            transaction_date: tx.date,
            content: tx.description,
          })
        )
      );

      await refreshAfterMutation(selectedWallet.id);
      // Trigger tự động xử lý streak khi có transaction, không cần gọi API activate

      // Đánh dấu thời gian tạo giao dịch mới (để hiển thị badge)
      setNewTransactionTime(Date.now());

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

  const handleSendVoice = async (audioUri: string) => {
    if (!selectedWallet?.id) {
      Alert.alert('Thông báo', 'Vui lòng chọn ví trước');
      setShowVoiceRecordingModal(false);
      return;
    }

    try {
      setIsProcessingVoice(true);
      setShowVoiceRecordingModal(false);

      // Lấy thời gian hiện tại để thêm vào text (giúp AI nhận diện thời gian chính xác)
      const now = new Date();
      const currentTime = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const currentDate = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      // Step 1: Convert audio to text
      const speechResponse = await aiApi.speechToText(audioUri, 'vi');
      const speechData = speechResponse.data;
      
      // Check if response has error code
      if (speechData.code !== 'SUCCESS') {
        Alert.alert('Lỗi', speechData.message || 'Không thể nhận diện giọng nói. Vui lòng thử lại.');
        return;
      }
      
      let text = speechData?.data?.text;

      if (!text || !text.trim()) {
        Alert.alert('Lỗi', 'Không thể nhận diện giọng nói. Vui lòng thử lại.');
        return;
      }

      // Thêm thông tin thời gian vào text nếu chưa có
      // Giúp AI nhận diện thời gian chính xác hơn
      if (!text.includes('hôm nay') && !text.includes('hôm qua') && !text.match(/\d{1,2}\/\d{1,2}/)) {
        text = `${text.trim()} (Thời gian: ${currentTime}, Ngày: ${currentDate})`;
      }

      // Step 2: Parse text to transactions using AI
      await processTextToTransactions(text.trim());
    } catch (error) {
      console.error('Failed to process voice:', error);
      Alert.alert(
        'Lỗi',
        getErrorMessage(error, 'Không thể xử lý giọng nói. Vui lòng thử lại.'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // OCR handlers
  const handleCaptureImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập camera để chụp ảnh.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to capture image:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleSendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleSendImage = async (imageUri: string) => {
    if (!selectedWallet?.id) {
      Alert.alert('Thông báo', 'Vui lòng chọn ví trước');
      setShowOCRGuideModal(false);
      return;
    }

    try {
      setIsProcessingImage(true);
      setShowOCRGuideModal(false);

      // Step 1: Extract text from image using OCR
      const ocrResponse = await aiApi.imageToText(imageUri, ['vi', 'en']);
      const ocrData = ocrResponse.data;
      
      // Check if response has error code
      if (ocrData.code !== 'SUCCESS') {
        Alert.alert('Lỗi', ocrData.message || 'Không thể trích xuất văn bản từ hình ảnh. Vui lòng thử lại.');
        return;
      }
      
      const text = ocrData?.data?.text;

      if (!text || !text.trim()) {
        Alert.alert('Lỗi', 'Không tìm thấy văn bản trong hình ảnh. Vui lòng thử lại với ảnh rõ hơn.');
        return;
      }

      // Step 2: Parse text to transactions using AI
      await processTextToTransactions(text.trim());
    } catch (error) {
      console.error('Failed to process image:', error);
      Alert.alert(
        'Lỗi',
        getErrorMessage(error, 'Không thể xử lý hình ảnh. Vui lòng thử lại.'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Helper function to process text to transactions (reused by voice and OCR)
  const processTextToTransactions = async (text: string) => {
    try {
      setIsParsingText(true);

      // Log text trước khi gửi vào AI parsing
      console.log('[AddTransactionScreen] Text gửi vào AI parsing:');
      console.log('─────────────────────────────────────────');
      console.log(text);
      console.log('─────────────────────────────────────────');

      // Gọi AI để parse text thành transactions
      const response = await aiApi.parseTextToTransactions(text);
      const responseData = response.data;
      
      // Check if response has error code
      if (responseData.code !== 'SUCCESS') {
        Alert.alert('Lỗi', responseData.message || 'Không thể phân tích text. Vui lòng thử lại.');
        return;
      }
      
      const parsedTransactions = responseData?.data?.transactions || [];

      if (parsedTransactions.length === 0) {
        Alert.alert('Thông báo', 'Không tìm thấy giao dịch nào từ text này');
        return;
      }

      // Lọc các transaction có user_category_id (đã map được với danh mục)
      const validTransactions = parsedTransactions.filter((tx: any) => tx.user_category_id !== null);
      const invalidTransactions = parsedTransactions.filter((tx: any) => tx.user_category_id === null);

      if (validTransactions.length === 0) {
        Alert.alert(
          'Thông báo',
          `Không tìm thấy danh mục phù hợp cho các giao dịch:\n${parsedTransactions
            .map((tx: any) => `• ${tx.content} - ${tx.category_name}`)
            .join('\n')}\n\nVui lòng tạo danh mục trước hoặc thử lại.`
        );
        return;
      }

      const detectedList = validTransactions.map((tx: any, index: number) => ({
        id: `detected-${Date.now()}-${index}`,
        description: tx.content?.trim() ?? '',
        amount: Number(tx.amount) || 0,
        categoryId: tx.user_category_id,
            type: tx.type,
        date: tx.transaction_date,
        category: resolveCategory(tx.user_category_id),
      }));

      setDetectedTransactions(detectedList);
      setShowDetectedModal(true);

      if (invalidTransactions.length > 0) {
        Alert.alert(
          'Chú ý',
          `Không tìm thấy danh mục cho ${invalidTransactions.length} giao dịch:\n${invalidTransactions
            .map((tx: any) => `• ${tx.content} - ${tx.category_name}`)
            .join('\n')}\n\nBạn có thể thêm danh mục rồi thử lại.`
        );
      }
    } catch (error) {
      console.error('Failed to parse text with AI:', error);
      Alert.alert(
        'Lỗi',
        getErrorMessage(error, 'Không thể phân tích text. Vui lòng thử lại.'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsParsingText(false);
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
        <ScrollView ref={scrollViewRef}>
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
                  // Giao dịch mới nếu được tạo trong 5 phút gần đây (so với thời gian hiện tại)
                  const transactionTime = new Date(transaction.createdAt).getTime();
                  const now = Date.now();
                  const fiveMinutesAgo = now - 5 * 60 * 1000;
                  const isNew = transactionTime >= fiveMinutesAgo;

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
                            <View style={styles.transactionNoteContainer}>
                            <Text style={styles.transactionNote}>{transaction.note || transaction.content || ''}</Text>
                              {isNew && (
                                <View style={styles.newBadge}>
                                  <Text style={styles.newBadgeText}>Mới</Text>
                                </View>
                              )}
                            </View>
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

        <WalletSelectModal
            visible={showWalletModal}
          selectedWalletId={selectedWallet?.id || null}
            onDismiss={() => setShowWalletModal(false)}
          onSelect={handleWalletSelectById}
          title="Chọn ví"
        />

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
          categories={modalCategories}
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
          categories={modalCategories}
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
          categories={modalCategories}
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
  transactionNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  transactionNote: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
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


