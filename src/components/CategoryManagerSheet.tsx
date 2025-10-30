import React, { useEffect, useState } from 'react';
import { View, Alert, ScrollView, Platform } from 'react-native';
import { Portal, Modal, Text, IconButton, List, Button, Chip, Menu, Divider, SegmentedButtons, Dialog, TextInput } from 'react-native-paper';
import CategoryCreateForm from './CategoryCreateForm';
import { fakeApi } from '../services/fakeApi';

interface Props {
  userId: number;
  visible: boolean;
  onDismiss: () => void;
  onChanged?: () => void; // callback when categories changed
}

export default function CategoryManagerSheet({ userId, visible, onDismiss, onChanged }: Props) {
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

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: 'white', marginTop: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '80%' }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 22, fontWeight: '800' }}>Quản lý danh mục</Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>
        </View>
        <Divider />
        <ScrollView style={{ maxHeight: '70%' }} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6, rowGap: 8 }}>
          {data.map((c) => (
            <List.Item
              key={c.id}
              title={() => (
                <Chip
                  compact
                  mode="outlined"
                  icon={c.icon || 'tag-outline'}
                  style={{ borderColor: '#e5e7eb' }}
                  textStyle={{ fontSize: 14, fontWeight: '600' }}
                >
                  {c.name}
                </Chip>
              )}
              right={() => (
                <Menu
                  visible={menuId === c.id}
                  onDismiss={() => setMenuId(null)}
                  anchor={<IconButton icon="dots-vertical" onPress={() => setMenuId(c.id)} />}
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
              )}
            />
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <SegmentedButtons
            value={filterType}
            onValueChange={(v: any) => setFilterType(v)}
            buttons={[{ value: 'expense', label: 'Chi tiêu' }, { value: 'income', label: 'Thu nhập' }]}
          />
        </View>
        <View style={{ padding: 16 }}>
          <Button mode="outlined" onPress={() => setCreateVisible(true)} style={{ borderRadius: 28 }} contentStyle={{ paddingVertical: 6 }}>
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


