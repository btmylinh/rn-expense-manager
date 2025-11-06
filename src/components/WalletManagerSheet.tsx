import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert, ScrollView, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, Divider, IconButton, Modal, Portal, Text, TextInput, Chip, List, Menu } from 'react-native-paper';

import { fakeApi } from '../services/fakeApi';

interface Props {
    userId: number;
    visible: boolean;
    onDismiss: () => void;
    onWalletChanged?: (walletId: number) => void;
}

export default function WalletManagerSheet({ userId, visible, onDismiss, onWalletChanged }: Props) {
    const [loading, setLoading] = useState(false);
    const [wallets, setWallets] = useState<Array<{ id: number, name: string, currency: string, amount: number, is_default?: boolean }>>([]);
    const [currentWalletId, setCurrentWalletId] = useState<number | undefined>(undefined);
    const [createVisible, setCreateVisible] = useState(false);
    const [editVisible, setEditVisible] = useState(false);
    const [transferVisible, setTransferVisible] = useState(false);
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState<'VND' | 'USD'>('VND');
    const [amount, setAmount] = useState('');
    const [currencyPicker, setCurrencyPicker] = useState(false);
    
    // Edit wallet states
    const [editingWalletId, setEditingWalletId] = useState<number | undefined>(undefined);
    const [editName, setEditName] = useState('');
    const [editCurrency, setEditCurrency] = useState<'VND' | 'USD'>('VND');
    const [editCurrencyPicker, setEditCurrencyPicker] = useState(false);
    
    // Transfer states
    const [fromWalletId, setFromWalletId] = useState<number | undefined>(undefined);
    const [toWalletId, setToWalletId] = useState<number | undefined>(undefined);
    const [transferAmount, setTransferAmount] = useState('');
    const [transferNote, setTransferNote] = useState('');
    const [fromWalletPicker, setFromWalletPicker] = useState(false);
    const [toWalletPicker, setToWalletPicker] = useState(false);

    useEffect(() => {
        if (!visible) return;
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const [ws, cw] = await Promise.all([
                    fakeApi.getWallets(userId),
                    fakeApi.getCurrentWalletId(userId),
                ]);
                if (!mounted) return;
                setWallets(ws as any);
                setCurrentWalletId((cw as any)?.walletId);
            } finally {
                setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [visible, userId]);

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

    const canSubmit = () => name.trim().length >= 2 && parseFormattedNumber(amount) >= 0;

    const refreshWallets = async () => {
        const ws = await fakeApi.getWallets(userId);
        setWallets(ws as any);
        const cw = await fakeApi.getCurrentWalletId(userId);
        setCurrentWalletId((cw as any)?.walletId);
    };

    const openEditWallet = (wallet: any) => {
        setEditingWalletId(wallet.id);
        setEditName(wallet.name);
        setEditCurrency(wallet.currency);
        setEditVisible(true);
    };

    const handleEditWallet = async () => {
        if (!editingWalletId || editName.trim().length < 2) {
            Alert.alert('Lỗi', 'Tên ví phải có ít nhất 2 ký tự');
            return;
        }
        try {
            setLoading(true);
            const res = await fakeApi.updateWallet(userId, editingWalletId, {
                name: editName.trim(),
                currency: editCurrency
            });
            if (!(res as any).success) {
                Alert.alert('Lỗi', (res as any).message || 'Không thể cập nhật ví');
                return;
            }
            await refreshWallets();
            setEditVisible(false);
            Alert.alert('Thành công', 'Đã cập nhật ví');
        } finally {
            setLoading(false);
        }
    };

    const openTransfer = () => {
        if (wallets.length < 2) {
            Alert.alert('Thông báo', 'Bạn cần có ít nhất 2 ví để thực hiện chuyển tiền');
            return;
        }
        setFromWalletId(undefined);
        setToWalletId(undefined);
        setTransferAmount('');
        setTransferNote('');
        setTransferVisible(true);
    };

    const handleTransfer = async () => {
        if (!fromWalletId || !toWalletId) {
            Alert.alert('Lỗi', 'Vui lòng chọn ví nguồn và ví đích');
            return;
        }
        const amount = parseFormattedNumber(transferAmount);
        if (amount <= 0) {
            Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
            return;
        }
        try {
            setLoading(true);
            const res = await fakeApi.transferBetweenWallets(
                userId,
                fromWalletId,
                toWalletId,
                amount,
                transferNote.trim() || undefined
            );
            if (!(res as any).success) {
                Alert.alert('Lỗi', (res as any).message || 'Không thể chuyển tiền');
                return;
            }
            await refreshWallets();
            setTransferVisible(false);
            Alert.alert('Thành công', (res as any).message || 'Đã chuyển tiền thành công');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ backgroundColor: 'white', marginTop: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '80%' }}>
                <View style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 18, fontWeight: '700' }}>Danh sách ví</Text>
                        <IconButton icon="close" onPress={onDismiss} />
                    </View>
                </View>
                <Divider />
                <ScrollView style={{ maxHeight: '70%' }}>
                    {wallets.map(w => (
                        <List.Item
                            key={w.id}
                            title={() => (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontWeight: '600' }}>{w.name}</Text>
                                    {w.is_default ? <Chip compact style={{ marginLeft: 8 }} selectedColor="#2563EB">Mặc định</Chip> : null}
                                </View>
                            )}
                            description={`${w.amount.toLocaleString('vi-VN')} ${w.currency}`}
                            right={() => (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {currentWalletId === w.id ? <IconButton icon="check" iconColor="#22C55E" onPress={() => { }} /> : null}
                                    <IconButton icon="pencil" iconColor="#3B82F6" onPress={() => openEditWallet(w)} />
                                    {w.is_default ? (
                                        <IconButton icon="star" iconColor="#F59E0B" onPress={() => { }} />
                                    ) : (
                                        <IconButton icon="star-outline" onPress={async () => { const r = await fakeApi.setDefaultWallet(userId, w.id); if ((r as any).success) { await refreshWallets(); } }} />
                                    )}
                                    {!w.is_default ? (
                                        <IconButton icon="close-circle" iconColor="#EF4444" onPress={() => {
                                            Alert.alert('Xóa ví', `Xóa ví '${w.name}'? Hành động này không thể hoàn tác`, [
                                                { text: 'Hủy' },
                                                { text: 'Xóa', style: 'destructive', onPress: async () => { const res = await fakeApi.deleteWallet(userId, w.id); if (!(res as any).success) { Alert.alert('Lỗi', (res as any).message || 'Không thể xóa'); return; } await refreshWallets(); } },
                                            ]);
                                        }} />
                                    ) : null}
                                </View>
                            )}
                            onPress={async () => { await fakeApi.setCurrentWallet(userId, w.id); setCurrentWalletId(w.id); onWalletChanged?.(w.id); onDismiss(); }}
                        />
                    ))}
                </ScrollView>
                <View style={{ padding: 16, gap: 8 }}>
                    <Button mode="outlined" onPress={() => setCreateVisible(true)}>Tạo ví mới</Button>
                    <Button mode="outlined" icon="swap-horizontal" onPress={openTransfer}>Chuyển tiền giữa ví</Button>
                </View>

                {/* Create nested sheet */}
                <Portal>
                    <Modal visible={createVisible} onDismiss={() => setCreateVisible(false)} contentContainerStyle={{ backgroundColor: 'white', marginTop: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '60%' }}>
                        <KeyboardAwareScrollView
                            enableOnAndroid
                            extraScrollHeight={Platform.OS === 'ios' ? 24 : 36}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ padding: 16 }}
                        >
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 18, fontWeight: '700' }}>Thêm ví mới</Text>
                                    <IconButton icon="close" onPress={() => setCreateVisible(false)} />
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <TextInput label="Nhập tên ví" value={name} onChangeText={setName} />
                                    </View>
                                    <Menu
                                        visible={currencyPicker}
                                        onDismiss={() => setCurrencyPicker(false)}
                                        anchor={<Button mode="outlined" onPress={() => setCurrencyPicker(true)}>{currency}</Button>}
                                    >
                                        <Menu.Item onPress={() => { setCurrency('VND'); setCurrencyPicker(false); }} title="VND" />
                                        <Menu.Item onPress={() => { setCurrency('USD'); setCurrencyPicker(false); }} title="USD" />
                                    </Menu>
                                </View>
                                <View style={{ marginTop: 12 }}>
                                    <TextInput label="Nhập số dư ban đầu" keyboardType="numeric" value={amount} onChangeText={(t) => setAmount(formatNumberInput(t))} left={<TextInput.Icon icon="currency-usd" />} />
                                </View>
                                <View style={{ marginTop: 16 }}>
                                    <Button mode="contained" disabled={!canSubmit()} loading={loading} onPress={async () => {
                                        if (!canSubmit()) return;
                                        try {
                                            setLoading(true);
                                            const res = await fakeApi.createWallet(userId, name.trim(), parseFormattedNumber(amount), currency);
                                            if (!(res as any).success) { Alert.alert('Lỗi', (res as any).message || 'Không thể tạo ví'); return; }
                                            await fakeApi.setCurrentWallet(userId, (res as any).wallet.id);
                                            setCurrentWalletId((res as any).wallet.id);
                                            onWalletChanged?.((res as any).wallet.id);
                                            await refreshWallets();
                                            setCreateVisible(false);
                                            setName(''); setAmount('');
                                            Alert.alert('Đã tạo ví');
                                        } finally { setLoading(false); }
                                    }}>Lưu</Button>
                                </View>
                            </KeyboardAwareScrollView>
                    </Modal>
                </Portal>

                {/* Edit Wallet Modal */}
                <Portal>
                    <Modal visible={editVisible} onDismiss={() => setEditVisible(false)} contentContainerStyle={{ backgroundColor: 'white', marginTop: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '50%' }}>
                        <KeyboardAwareScrollView
                            enableOnAndroid
                            extraScrollHeight={Platform.OS === 'ios' ? 24 : 36}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ padding: 16 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 18, fontWeight: '700' }}>Sửa ví</Text>
                                <IconButton icon="close" onPress={() => setEditVisible(false)} />
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <TextInput label="Tên ví" value={editName} onChangeText={setEditName} />
                                </View>
                                <Menu
                                    visible={editCurrencyPicker}
                                    onDismiss={() => setEditCurrencyPicker(false)}
                                    anchor={<Button mode="outlined" onPress={() => setEditCurrencyPicker(true)}>{editCurrency}</Button>}
                                >
                                    <Menu.Item onPress={() => { setEditCurrency('VND'); setEditCurrencyPicker(false); }} title="VND" />
                                    <Menu.Item onPress={() => { setEditCurrency('USD'); setEditCurrencyPicker(false); }} title="USD" />
                                </Menu>
                            </View>
                            <View style={{ marginTop: 16 }}>
                                <Button mode="contained" disabled={editName.trim().length < 2} loading={loading} onPress={handleEditWallet}>Lưu</Button>
                            </View>
                        </KeyboardAwareScrollView>
                    </Modal>
                </Portal>

                {/* Transfer Modal */}
                <Portal>
                    <Modal visible={transferVisible} onDismiss={() => setTransferVisible(false)} contentContainerStyle={{ backgroundColor: 'white', marginTop: 'auto', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '60%' }}>
                        <KeyboardAwareScrollView
                            enableOnAndroid
                            extraScrollHeight={Platform.OS === 'ios' ? 24 : 36}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{ padding: 16 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 18, fontWeight: '700' }}>Chuyển tiền giữa ví</Text>
                                <IconButton icon="close" onPress={() => setTransferVisible(false)} />
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <Text style={{ marginBottom: 8, fontWeight: '600' }}>Từ ví</Text>
                                <Menu
                                    visible={fromWalletPicker}
                                    onDismiss={() => setFromWalletPicker(false)}
                                    anchor={
                                        <Button mode="outlined" onPress={() => setFromWalletPicker(true)}>
                                            {fromWalletId ? wallets.find(w => w.id === fromWalletId)?.name || 'Chọn ví' : 'Chọn ví nguồn'}
                                        </Button>
                                    }
                                >
                                    {wallets.map(w => (
                                        <Menu.Item 
                                            key={w.id} 
                                            onPress={() => { setFromWalletId(w.id); setFromWalletPicker(false); }} 
                                            title={`${w.name} (${w.amount.toLocaleString('vi-VN')} ${w.currency})`}
                                            disabled={w.id === toWalletId}
                                        />
                                    ))}
                                </Menu>
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <Text style={{ marginBottom: 8, fontWeight: '600' }}>Đến ví</Text>
                                <Menu
                                    visible={toWalletPicker}
                                    onDismiss={() => setToWalletPicker(false)}
                                    anchor={
                                        <Button mode="outlined" onPress={() => setToWalletPicker(true)}>
                                            {toWalletId ? wallets.find(w => w.id === toWalletId)?.name || 'Chọn ví' : 'Chọn ví đích'}
                                        </Button>
                                    }
                                >
                                    {wallets.map(w => (
                                        <Menu.Item 
                                            key={w.id} 
                                            onPress={() => { setToWalletId(w.id); setToWalletPicker(false); }} 
                                            title={`${w.name} (${w.amount.toLocaleString('vi-VN')} ${w.currency})`}
                                            disabled={w.id === fromWalletId}
                                        />
                                    ))}
                                </Menu>
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <TextInput 
                                    label="Số tiền chuyển" 
                                    keyboardType="numeric" 
                                    value={transferAmount} 
                                    onChangeText={(t) => setTransferAmount(formatNumberInput(t))} 
                                    left={<TextInput.Icon icon="cash" />} 
                                />
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <TextInput 
                                    label="Ghi chú (tùy chọn)" 
                                    value={transferNote} 
                                    onChangeText={setTransferNote}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            <View style={{ marginTop: 16 }}>
                                <Button 
                                    mode="contained" 
                                    disabled={!fromWalletId || !toWalletId || parseFormattedNumber(transferAmount) <= 0} 
                                    loading={loading} 
                                    onPress={handleTransfer}
                                >
                                    Chuyển tiền
                                </Button>
                            </View>
                        </KeyboardAwareScrollView>
                    </Modal>
                </Portal>
            </Modal>
        </Portal>
    );
}


