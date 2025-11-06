import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Menu, Portal, Modal } from 'react-native-paper';
import { useAppTheme, getIconColor } from '../theme';
import { formatCurrency } from '../utils/format';
import TransactionModal from './TransactionModal';
import { fakeApi } from '../services/fakeApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.8;

interface DetectedTransaction {
  id: number | string;
  description: string;
  amount: number;
  categoryId: number;
  type: number;
  date: string;
  category?: {
    id: number;
    name: string;
    icon?: string;
    type: number;
  };
}

interface DetectedTransactionsModalProps {
  visible: boolean;
  onDismiss: () => void;
  transactions: DetectedTransaction[];
  categories: Array<{
    id: number;
    name: string;
    icon?: string;
    type: number;
  }>;
  onCategoryChange?: (transactionId: number | string, categoryId: number) => void;
  onDelete?: (transactionId: number | string) => void;
  onEdit?: (transaction: DetectedTransaction) => void;
  onSave: () => void;
  onTransactionUpdate?: (transactionId: number | string, updatedData: any) => void;
  loading?: boolean;
  userId?: number;
  walletId?: number;
}

export default function DetectedTransactionsModal({
  visible,
  onDismiss,
  transactions,
  categories,
  onCategoryChange,
  onDelete,
  onEdit,
  onSave,
  onTransactionUpdate,
  loading = false,
  userId = 1,
  walletId,
}: DetectedTransactionsModalProps) {
  const theme = useAppTheme();
  const [categoryMenus, setCategoryMenus] = useState<{ [key: string]: boolean }>({});
  const [editingTransaction, setEditingTransaction] = useState<DetectedTransaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handler to open edit modal
  const handleTransactionPress = (transaction: DetectedTransaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
  };

  // Handler to save transaction
  const handleSaveTransaction = async (data: {
    amount: number;
    transactionDate: string;
    content: string;
    userCategoryId: number;
    type: number;
  }) => {
    if (!editingTransaction) return;

    try {
      setIsSaving(true);

      // Update transaction in local state
      const updatedTransaction = {
        ...editingTransaction,
        amount: data.amount,
        description: data.content,
        date: data.transactionDate,
        categoryId: data.userCategoryId,
        type: data.type,
        category: categories.find(c => c.id === data.userCategoryId),
      };

      // Call callback to update parent state
      if (onTransactionUpdate) {
        onTransactionUpdate(editingTransaction.id, updatedTransaction);
      }

      // If transaction has a real ID (not temp), update via API
      if (typeof editingTransaction.id === 'number') {
        await fakeApi.updateTransaction(userId, editingTransaction.id, data);
      }

      setShowEditModal(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getCategoryById = (categoryId: number) => {
    return categories.find(c => c.id === categoryId) || categories[0];
  };

  const openCategoryMenu = (transactionId: number | string) => {
    setCategoryMenus(prev => ({ ...prev, [transactionId]: true }));
  };

  const closeCategoryMenu = (transactionId: number | string) => {
    setCategoryMenus(prev => ({ ...prev, [transactionId]: false }));
  };

  return (
    <>
    <Portal>
    <Modal
      visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface}]}
    >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.outline + '20' }]}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Giao dịch đã phát hiện
            </Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Intro Text */}
            <Text style={[styles.introText, { color: theme.colors.onSurfaceVariant }]}>
              AI đã phát hiện {transactions.length} giao dịch từ tin nhắn của bạn. Vui lòng kiểm tra và chỉnh sửa nếu cần.
            </Text>

            {/* Transactions List */}
            {transactions.map((transaction, index) => {
              const category = transaction.category || getCategoryById(transaction.categoryId);
              const categoryColor = getIconColor(category.icon, theme);
              const expenseCategories = categories.filter(c => c.type === 2);

              return (
                <TouchableOpacity
                  key={transaction.id}
                  style={[
                    styles.transactionCard,
                    index === transactions.length - 1 && styles.lastCard
                  ]}
                  onPress={() => handleTransactionPress(transaction)}
                  activeOpacity={0.7}
                >
                  {/* Left side - Delete button */}
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      onDelete?.(transaction.id);
                    }}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>

                  {/* Middle - Transaction info */}
                  <View style={styles.transactionInfo}>
                    {/* Category display (view only) */}
                    <View style={styles.categoryDisplay}>
                      <View style={[styles.categoryIconSmall, { backgroundColor: categoryColor + '22' }]}>
                        <MaterialCommunityIcons 
                          name={category.icon as any || 'tag-outline'} 
                          size={14} 
                          color={categoryColor} 
                        />
                      </View>
                      <Text style={[styles.categoryNameText, { color: categoryColor }]}>
                        {category.name}
                      </Text>
                    </View>

                    {/* Date */}
                    <Text style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
                      {formatDate(transaction.date)}
                    </Text>

                    {/* Description */}
                    <Text style={[styles.descriptionText, { color: theme.colors.onSurface }]}>
                      {transaction.description}
                    </Text>
                  </View>

                  {/* Right side - Amount and edit button */}
                  <View style={styles.rightSection}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleTransactionPress(transaction);
                      }}
                      style={styles.menuButton}
                    >
                      <MaterialCommunityIcons name="dots-vertical" size={20} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>

                    <Text style={[styles.amountText, { color: theme.colors.error }]}>
                      -{formatCurrency(Math.abs(transaction.amount))}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer - Save Button */}
          <View style={[styles.footer, { borderTopColor: theme.colors.outline + '20' }]}>
            <Button
              mode="contained"
              onPress={onSave}
              disabled={loading || transactions.length === 0}
              style={styles.saveButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              loading={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu giao dịch'}
            </Button>
          </View>
      </Modal>
    </Portal>

    {/* Edit Transaction Modal - Uses its own Portal */}
        {editingTransaction && (
          <TransactionModal
            visible={showEditModal}
            mode="edit"
            transaction={{
              id: typeof editingTransaction.id === 'number' ? editingTransaction.id : 0,
              userId: userId,
              walletId: walletId || 1,
              userCategoryId: editingTransaction.categoryId,
              amount: Math.abs(editingTransaction.amount),
              content: editingTransaction.description,
              transactionDate: editingTransaction.date,
              type: editingTransaction.type,
              createdAt: new Date().toISOString(),
            }}
            categories={categories}
            onDismiss={() => {
              setShowEditModal(false);
              setEditingTransaction(null);
            }}
            onSave={handleSaveTransaction}
            loading={isSaving}
          />
        )}
  </>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: MODAL_HEIGHT,
    marginTop: 'auto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  introText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3
  },
  lastCard: {
    marginBottom: 0,
  },
  deleteButton: {
    padding: 8,
    marginRight: 8,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
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
    fontSize: 13,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  menuButton: {
    padding: 4,
    marginBottom: 4,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 12,
  },
});
