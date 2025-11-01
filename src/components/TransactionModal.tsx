import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  Button,
  Portal,
  Modal,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DatePickerModal } from 'react-native-paper-dates';
import CategorySelectModal from './CategorySelectModal';
import { getIconColor, useAppTheme } from '../theme';

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

interface Category {
  id: number;
  userId?: number;
  name: string;
  type: number; // 1 income, 2 expense
  icon?: string;
  color?: string;
}

interface TransactionModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  transaction?: Transaction | null;
  categories: Category[];
  onDismiss: () => void;
  onSave: (data: {
    amount: number;
    transactionDate: string;
    content: string;
    userCategoryId: number;
    type: number;
  }) => Promise<void>;
  loading?: boolean;
}

export default function TransactionModal({
  visible,
  mode,
  transaction,
  categories,
  onDismiss,
  onSave,
  loading = false,
}: TransactionModalProps) {
  const theme = useTheme();
  const appTheme = useAppTheme();

  // Form state
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [openDatePicker, setOpenDatePicker] = useState(false);

  // Helper functions
  const formatNumberInput = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (!numericValue) return '';
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('vi-VN');
  };

  const parseFormattedNumber = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString || !dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return undefined;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Initialize form when transaction changes or modal opens
  useEffect(() => {
    if (visible && mode === 'edit' && transaction) {
      setAmount(formatNumberInput(String(Math.abs(transaction.amount))));
      setDate(transaction.transactionDate);
      setNote((transaction.note || transaction.content || '').slice(0, 250));
      setCategoryId(transaction.userCategoryId);
      setType(transaction.type === 1 ? 'income' : 'expense');
    } else if (visible && mode === 'add') {
      // Reset form for add mode
      const today = new Date();
      setAmount('');
      setDate(formatDate(today));
      setNote('');
      setCategoryId(null);
      setType('expense');
    }
  }, [visible, mode, transaction]);

  const handleSave = useCallback(async () => {
    const amt = parseFormattedNumber(amount);

    if (amt <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
      return;
    }

    if (!categoryId) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      return;
    }

    try {
      await onSave({
        amount: type === 'income' ? Math.abs(amt) : -Math.abs(amt),
        transactionDate: date,
        content: (note || '').slice(0, 250),
        userCategoryId: categoryId,
        type: type === 'income' ? 1 : 2,
      });
      onDismiss();
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu giao dịch');
    }
  }, [amount, date, note, categoryId, type, onSave, onDismiss]);

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.sheetContainer}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 16 : 32}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.editTitle}>
            {mode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}
          </Text>

          {/* Category Selection */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Danh mục</Text>
            <TouchableOpacity
              style={styles.categorySelectBtn}
              onPress={() => setShowCategoryModal(true)}
            >
              {selectedCategory ? (
                <View style={styles.categoryContent}>
                  <View
                    style={[
                      styles.categoryIconWrap,
                      {
                        backgroundColor:
                          getIconColor(selectedCategory.icon, appTheme) + '22',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={(selectedCategory.icon as any) || 'tag-outline'}
                      size={18}
                      color={getIconColor(selectedCategory.icon, appTheme)}
                    />
                  </View>
                  <Text style={styles.categorySelectedText}>
                    {selectedCategory.name}
                  </Text>
                </View>
              ) : (
                <Text style={styles.categoryPlaceholder}>Chọn danh mục</Text>
              )}
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Số tiền</Text>
            <TextInput
              value={amount}
              onChangeText={(text) => setAmount(formatNumberInput(text))}
              keyboardType="numeric"
              style={styles.fieldInput}
              placeholder="Nhập số tiền (VD: 1,000)"
            />
          </View>

          {/* Date Input */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Ngày</Text>
            <PaperTextInput
              value={date}
              onPressIn={() => setOpenDatePicker(true)}
              right={
                <PaperTextInput.Icon
                  icon="calendar"
                  onPress={() => setOpenDatePicker(true)}
                />
              }
              editable={false}
              dense={true}
              placeholder="YYYY-MM-DD"
              style={{ ...styles.fieldInput, height: 36 }}
            />
            <DatePickerModal
              locale="vi"
              mode="single"
              visible={openDatePicker}
              date={parseDate(date)}
              onDismiss={() => setOpenDatePicker(false)}
              onConfirm={({ date: selectedDate }) => {
                if (selectedDate) setDate(formatDate(selectedDate));
                setOpenDatePicker(false);
              }}
            />
          </View>

          {/* Note Input */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Nội dung giao dịch</Text>
            <TextInput
              value={note}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onChangeText={(t) => setNote((t || '').slice(0, 250))}
              style={[styles.fieldInput, { minHeight: 96 }]}
              placeholder="Nhập ghi chú"
            />
            <Text style={styles.charCount}>{note.length}/250</Text>
          </View>

          {/* Actions */}
          <View style={styles.sheetActions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              disabled={loading}
            >
              Huỷ
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </View>
        </KeyboardAwareScrollView>
      </Modal>

      {/* Category Select Modal */}
      <CategorySelectModal
        visible={showCategoryModal}
        categories={categories}
        selectedId={categoryId || undefined}
        onDismiss={() => setShowCategoryModal(false)}
        onSelect={(id) => {
          setCategoryId(id);
          // Update type based on selected category
          const cat = categories.find((c) => c.id === id);
          if (cat) {
            setType(cat.type === 1 ? 'income' : 'expense');
          }
        }}
        title="Chọn danh mục"
        mode="default"
        initialType={type}
      />
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: 'white',
    marginTop: 'auto',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
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
  charCount: {
    textAlign: 'right',
    color: '#6B7280',
    marginTop: 4,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

