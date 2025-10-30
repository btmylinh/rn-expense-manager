import React, { useMemo, useState } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { Portal, Modal, Text, TextInput, IconButton, Button, SegmentedButtons } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export type CategoryType = 'income' | 'expense';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (payload: { name: string; type: CategoryType; icon: string }) => Promise<void> | void;
  defaultType?: CategoryType;
  initialName?: string;
  initialType?: CategoryType;
  initialIcon?: string;
  title?: string;
  submitLabel?: string;
  allowTypeChange?: boolean;
}

const ICON_CHOICES: string[] = [
  'food', 'food-fork-drink', 'coffee', 'beer', 'cup', 'silverware-fork-knife',
  'bus', 'car', 'motorbike', 'gas-station', 'taxi', 'train', 'airplane',
  'home', 'lightbulb', 'water', 'sofa', 'broom', 'tools',
  'shopping', 'cart', 'bag-personal', 'shoe-sneaker', 'tshirt-crew', 'tag-outline',
  'wallet', 'credit-card', 'bank', 'currency-usd', 'piggy-bank', 'chart-line',
  'movie-open', 'gamepad-variant', 'music', 'ticket', 'book-open-page-variant',
  'heart', 'dumbbell', 'meditation', 'pill', 'spa', 'sleep',
  'school', 'laptop', 'book', 'pencil', 'library',
  'gift', 'party-popper', 'dog', 'cat', 'leaf'
];

export default function CategoryCreateForm({ visible, onDismiss, onSubmit, defaultType = 'expense', initialName, initialType, initialIcon, title, submitLabel, allowTypeChange = true }: Props) {
  const [name, setName] = useState(initialName || '');
  const [type, setType] = useState<CategoryType>(initialType || defaultType);
  const [icon, setIcon] = useState<string>(initialIcon || 'tag-outline');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => name.trim().length >= 2, [name]);

  // Sync initial values when dialog opens or props change
  React.useEffect(() => {
    if (visible) {
      setName(initialName || '');
      setType(initialType || defaultType);
      setIcon(initialIcon || 'tag-outline');
    }
  }, [visible, initialName, initialType, initialIcon, defaultType]);

  const handleSave = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      await onSubmit({ name: name.trim(), type, icon });
      setName('');
      setType(defaultType);
      setIcon('tag-outline');
      onDismiss();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: 'white', marginTop: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '70%' }}>
        <KeyboardAwareScrollView enableOnAndroid extraScrollHeight={Platform.OS === 'ios' ? 16 : 32} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '700' }}>{title || 'Thêm danh mục'}</Text>
            <IconButton icon="close" onPress={onDismiss} />
          </View>

          <View style={{ marginTop: 8 }}>
            <TextInput label="Tên danh mục" value={name} onChangeText={setName} />
          </View>

          {allowTypeChange ? (
            <View style={{ marginTop: 12 }}>
              <SegmentedButtons
                value={type}
                onValueChange={(v: any) => setType(v)}
                buttons={[{ value: 'expense', label: 'Chi', icon: 'minus' }, { value: 'income', label: 'Thu', icon: 'plus' }]}
              />
            </View>
          ) : null}

          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Chọn icon</Text>
            <ScrollView style={{ maxHeight: 260 }} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ICON_CHOICES.map(ic => (
                <IconButton
                  key={ic}
                  icon={ic as any}
                  mode={icon === ic ? 'contained' : 'outlined'}
                  containerColor={icon === ic ? '#3B82F6' : undefined}
                  iconColor={icon === ic ? 'white' : '#111827'}
                  onPress={() => setIcon(ic)}
                  style={{ borderRadius: 20 }}
                />
              ))}
            </ScrollView>
          </View>

          <View style={{ marginTop: 16 }}>
            <Button mode="contained" disabled={!canSubmit || loading} loading={loading} onPress={handleSave}>{submitLabel || 'Lưu'}</Button>
          </View>
        </KeyboardAwareScrollView>
      </Modal>
    </Portal>
  );
}


