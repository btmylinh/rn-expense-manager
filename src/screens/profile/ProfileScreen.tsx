// screens/ProfileScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { Avatar, Button, Divider, List, Portal, Dialog, TextInput, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import AppBar from '../../components/AppBar';
import { fakeApi } from '../../services/fakeApi';
import WalletManagerSheet from '../../components/WalletManagerSheet';
import CategoryManagerSheet from '../../components/CategoryManagerSheet';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen({ navigation }: any) {
	const theme = useAppTheme();
	const { user, logout } = useAuth();
	const userId = user?.id || 1;
	const [loading, setLoading] = useState(false);
	const [userName, setUserName] = useState<string>('');
	const [userEmail, setUserEmail] = useState<string>('');
	const [editVisible, setEditVisible] = useState(false);
	const [editName, setEditName] = useState('');
	const [editEmail, setEditEmail] = useState('');
	const [pwdVisible, setPwdVisible] = useState(false);
	const [curPwd, setCurPwd] = useState('');
	const [newPwd, setNewPwd] = useState('');
	const [cfmPwd, setCfmPwd] = useState('');

	// Wallet management state (delegated to component)
	const [walletSheetVisible, setWalletSheetVisible] = useState(false);
	const [currentWalletId, setCurrentWalletId] = useState<number | undefined>(undefined);
	const [categorySheetVisible, setCategorySheetVisible] = useState(false);

	useEffect(() => {
		// Sử dụng thông tin từ AuthContext
		if (user) {
			setUserName(user.name || 'Người dùng');
			setUserEmail(user.email || '');
		}

		// Load wallet info
		let mounted = true;
		const load = async () => {
			try {
				setLoading(true);
				const cw = await fakeApi.getCurrentWalletId(userId);
				if (mounted && (cw as any)?.walletId) setCurrentWalletId((cw as any).walletId);
			} finally {
				setLoading(false);
			}
		};
		load();
		return () => {
			mounted = false;
		};
	}, [user, userId]);

	const initials = useMemo(() => {
		const parts = (userName || '').trim().split(' ').filter(Boolean);
		if (parts.length === 0) return 'U';
		if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	}, [userName]);

	const openEdit = () => {
		setEditName(userName);
		setEditEmail(userEmail);
		setEditVisible(true);
	};

	const saveEdit = async () => {
		try {
			setLoading(true);
			const res = await fakeApi.updateUser(userId, { name: editName.trim(), email: editEmail.trim() });
			if (res.success && res.user) {
				setUserName(res.user.name || 'Người dùng');
				setUserEmail(res.user.email || '');
				setEditVisible(false);
			} else {
				Alert.alert('Lỗi', res.message || 'Cập nhật thất bại');
			}
		} catch (e: any) {
			Alert.alert('Lỗi', e?.message || 'Đã xảy ra lỗi');
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
			{ text: 'Hủy' },
			{ text: 'Đăng xuất', style: 'destructive', onPress: logout },
		]);
	};



	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<AppBar title="Hồ sơ" />
			<ScrollView contentContainerStyle={{ padding: theme.spacing(1) }}>
				{/* Header: Avatar + Name + Edit */}
				<View style={{ alignItems: 'center', marginBottom: theme.spacing(3) }}>
					<Avatar.Text size={80} label={initials} style={{ backgroundColor: theme.colors.primary }} color={theme.colors.onPrimary} />
					<Text style={[theme.semantic.typography.h2, { color: theme.colors.onSurface, marginTop: theme.spacing(2) }]}>{userName || 'Người dùng'}</Text>
					{userEmail ? (
						<Text style={[theme.semantic.typography.small, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>{userEmail}</Text>
					) : null}
				</View>

				{/* Sections */}
				<List.Section>
					<List.Subheader>Quản lý tài khoản</List.Subheader>
					<List.Item
						title="Thông tin cá nhân"
						left={props => <List.Icon {...props} icon="account-circle-outline" />}
						onPress={openEdit}
					/>
					<Divider />
					<List.Item
						title="Ví của tôi"
						left={props => <List.Icon {...props} icon="wallet-outline" />}
						onPress={() => setWalletSheetVisible(true)}
					/>
					<Divider />
					<List.Item
						title="Danh mục của tôi"
						left={props => <List.Icon {...props} icon="tag-outline" />}
						onPress={() => setCategorySheetVisible(true)}
					/>
					<Divider />
					<List.Item
						title="Cài đặt Streak"
						left={props => <List.Icon {...props} icon="fire"/>}
						onPress={() => navigation.navigate('StreakSettings')}
					/>
					<Divider />
					<List.Item
						title="Đổi mật khẩu"
						left={props => <List.Icon {...props} icon="key-variant" />}
						onPress={() => setPwdVisible(true)}
					/>
					<Divider />
					<List.Item
						title="Đăng xuất"
						left={props => <List.Icon {...props} icon="logout" />}
						onPress={handleLogout}
					/>
				</List.Section>
			</ScrollView>

			{/* Edit dialog */}
			<Portal>
				<Dialog visible={editVisible} onDismiss={() => setEditVisible(false)}>
					<Dialog.Title>Chỉnh sửa thông tin</Dialog.Title>
					<Dialog.Content>
						<TextInput
							label="Họ và tên"
							value={editName}
							onChangeText={setEditName}
							left={<TextInput.Icon icon="account" />}
							style={{ marginBottom: theme.spacing(2) }}
						/>
						<TextInput
							disabled
							label="Email"
							value={editEmail}
							onChangeText={setEditEmail}
							keyboardType="email-address"
							autoCapitalize="none"
							left={<TextInput.Icon icon="email-outline" />}
						/>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setEditVisible(false)}>Hủy</Button>
						<Button onPress={saveEdit} loading={loading}>Lưu</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

			{/* Change Password dialog */}
			<Portal>
				<Dialog visible={pwdVisible} onDismiss={() => setPwdVisible(false)}>
					<Dialog.Title>Đổi mật khẩu</Dialog.Title>
					<Dialog.Content>
						<TextInput
							label="Mật khẩu hiện tại"
							value={curPwd}
							onChangeText={setCurPwd}
							secureTextEntry
							left={<TextInput.Icon icon="lock" />}
							style={{ marginBottom: theme.spacing(2) }}
						/>
						<TextInput
							label="Mật khẩu mới"
							value={newPwd}
							onChangeText={setNewPwd}
							secureTextEntry
							left={<TextInput.Icon icon="lock-reset" />}
							style={{ marginBottom: theme.spacing(2) }}
						/>
						<TextInput
							label="Xác nhận mật khẩu mới"
							value={cfmPwd}
							onChangeText={setCfmPwd}
							secureTextEntry
							left={<TextInput.Icon icon="check" />}
						/>
					</Dialog.Content>
					<Dialog.Actions>
						<Button onPress={() => setPwdVisible(false)}>Hủy</Button>
						<Button onPress={async () => {
							if (!curPwd || !newPwd || !cfmPwd) { Alert.alert('Lỗi', 'Vui lòng điền đầy đủ'); return; }
							if (newPwd.length < 6) { Alert.alert('Lỗi', 'Mật khẩu mới phải từ 6 ký tự'); return; }
							if (newPwd !== cfmPwd) { Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp'); return; }
							try {
								setLoading(true);
								const res = await fakeApi.updatePassword(userId, curPwd, newPwd);
								if ((res as any).success) {
									Alert.alert('Thành công', 'Đổi mật khẩu thành công');
									setPwdVisible(false);
									setCurPwd(''); setNewPwd(''); setCfmPwd('');
								} else {
									Alert.alert('Lỗi', (res as any).message || 'Đổi mật khẩu thất bại');
								}
							} finally {
								setLoading(false);
							}
						}} loading={loading}>Lưu</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

			{/* Wallet manager (componentized) */}
			<WalletManagerSheet
				userId={userId}
				visible={walletSheetVisible}
				onDismiss={() => setWalletSheetVisible(false)}
				onWalletChanged={(id) => setCurrentWalletId(id)}
			/>

			<CategoryManagerSheet
				userId={userId}
				visible={categorySheetVisible}
				onDismiss={() => setCategorySheetVisible(false)}
				onChanged={() => {
					// Categories will be reloaded by useFocusEffect in other screens
					// when they regain focus
				}}
			/>

		</View>
	);
}
