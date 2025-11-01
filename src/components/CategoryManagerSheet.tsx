import React, { useEffect, useState } from 'react';
import { View, Alert, ScrollView, Platform, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Portal, Modal, Text, IconButton, List, Button, Chip, Menu, Divider, SegmentedButtons, Dialog, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CategoryCreateForm from './CategoryCreateForm';
import { fakeApi } from '../services/fakeApi';
import { useAppTheme, getIconColor } from '../theme';

interface Props {
  userId: number;
  visible: boolean;
  onDismiss: () => void;
  onChanged?: () => void; // callback when categories changed
}

export default function CategoryManagerSheet({ userId, visible, onDismiss, onChanged }: Props) {
  const theme = useAppTheme();
  const [categories, setCategories] = useState<Array<{ id: number; userId: number; name: string; type: number; icon?: string; color?: string }>>([]);
  const [createVisible, setCreateVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'expense' | 'income'>('expense');
  const [menuId, setMenuId] = useState<number | null>(null);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameName, setRenameName] = useState('');
  const [renameIcon, setRenameIcon] = useState<string>('tag-outline');
  const [editVisible, setEditVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    (async () => {
      const list = await fakeApi.getUserCategories(userId);
      if (mounted) setCategories(list as any);
    })();
    return () => { mounted = false; };
  }, [visible, userId]);

  const refresh = async () => {
    const list = await fakeApi.getUserCategories(userId);
    setCategories(list as any);
    onChanged?.();
  };

  // validation handled inside CategoryCreateForm

  const data = categories.filter(c => c.type === (filterType === 'income' ? 1 : 2));

  const styles = StyleSheet.create({
    bottomSheet: {
      backgroundColor: '#FFF',
      marginTop: 'auto',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: '80%',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    segmentedContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    categoryItem: {
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    catIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    categoryName: {
      fontSize: 16,
      color: '#222',
      fontWeight: '500',
    },
    addButtonWrap: {
      padding: 16,
      paddingTop: 8,
    },
  });

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.bottomSheet}>
        <View style={styles.header}>
          <Text style={styles.title}>Quản lý danh mục</Text>
          <IconButton icon="close" onPress={onDismiss} size={20} />
          </View>

        <View style={styles.segmentedContainer}>
          <SegmentedButtons
            value={filterType}
            onValueChange={(v: any) => setFilterType(v)}
            buttons={[{ value: 'expense', label: 'Chi tiêu' }, { value: 'income', label: 'Thu nhập' }]}
          />
        </View>

        <FlatList
          data={data}
          keyExtractor={(c) => String(c.id)}
          style={styles.listContainer}
          renderItem={({ item: c }) => (
            <View style={styles.categoryItem}>
              <View style={styles.categoryLeft}>
                <View style={[styles.catIconWrap, { backgroundColor: getIconColor(c.icon, theme) + '22' }]}>
                  <MaterialCommunityIcons name={c.icon as any || 'tag-outline'} size={20} color={getIconColor(c.icon, theme)} />
                </View>
                <Text style={styles.categoryName}>{c.name}</Text>
              </View>
                <Menu
                  visible={menuId === c.id}
                  onDismiss={() => setMenuId(null)}
                anchor={<IconButton icon="dots-vertical" onPress={() => setMenuId(c.id)} size={20} />}
                >
                  <Menu.Item title="Sửa" onPress={() => { setMenuId(null); setRenameId(c.id); setRenameName(c.name); setRenameIcon(c.icon || 'tag-outline'); setEditVisible(true); }} />
                  <Menu.Item title="Xóa" onPress={() => {
                    setMenuId(null);
                    Alert.alert('Xóa danh mục', `Xóa danh mục '${c.name}'?`, [
                      { text: 'Hủy' },
                      { text: 'Xóa', style: 'destructive', onPress: async () => {
                        const res = await fakeApi.deleteCategory(userId, c.id);
                        if (!(res as any).success) { Alert.alert('Lỗi', (res as any).message || 'Không thể xóa'); return; }
                        refresh();
                      } }
                    ]);
                  }} />
                </Menu>
            </View>
          )}
        />

        <View style={styles.addButtonWrap}>
          <Button mode="outlined" onPress={() => setCreateVisible(true)} style={{ borderRadius: 24 }}>
            Thêm danh mục
          </Button>
        </View>

        <CategoryCreateForm
          visible={createVisible}
          onDismiss={() => setCreateVisible(false)}
          initialType={filterType}
          allowTypeChange={false}
          onSubmit={async ({ name, type, icon }) => {
            setLoading(true);
            try {
              // Force type from current tab
              const forcedType = filterType === 'income' ? 1 : 2;
              await fakeApi.addCategory(userId, name, forcedType, icon);
              await refresh();
            } finally { setLoading(false); }
          }}
        />

        <CategoryCreateForm
          visible={editVisible}
          onDismiss={() => { setEditVisible(false); setRenameId(null); }}
          title="Sửa danh mục"
          submitLabel="Lưu"
          initialName={renameName}
          initialType={filterType}
          initialIcon={renameIcon}
          allowTypeChange={false}
          onSubmit={async ({ name, icon }) => {
            if (!renameId) return;
            await fakeApi.updateCategory(userId, renameId, { name: name.trim(), icon });
            setEditVisible(false);
            setRenameId(null);
            refresh();
          }}
        />
      </Modal>
    </Portal>
  );
}


