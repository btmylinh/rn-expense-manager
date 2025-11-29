// screens/ProfileScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { Avatar, Button, Divider, List, Portal, Dialog, TextInput, Text, Switch } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import AppBar from '../../components/AppBar';
import { isAxiosError } from 'axios';
import WalletManagerSheet from '../../components/WalletManagerSheet';
import CategoryManagerSheet from '../../components/CategoryManagerSheet';
import { useAuth } from '../../contexts/AuthContext';
import { userApi, walletApi, twoFactorApi, authApi } from '../../api';
import { getErrorMessage } from '../../utils/errorHandler';

export default function ProfileScreen({ navigation }: any) {
	const theme = useAppTheme();
	const { user, logout, refreshUser } = useAuth();
	const userId = user?.id;
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

	const [wallets, setWallets] = useState<any[]>([]);
	// Wallet management state (delegated to component)
	const [walletSheetVisible, setWalletSheetVisible] = useState(false);
	const [currentWalletId, setCurrentWalletId] = useState<number | undefined>(undefined);
	const [categorySheetVisible, setCategorySheetVisible] = useState(false);
	
	// 2FA state
	const [is2FAEnabled, setIs2FAEnabled] = useState(false);
	const [loading2FA, setLoading2FA] = useState(false);

	useEffect(() => {
		let active = true;
		const load = async () => {
			try {
				setLoading(true);
				if (user) {
					setUserName(user.name || 'Người dùng');
					setUserEmail(user.email || '');
				}
				const [profileRes, walletsRes, twoFactorRes] = await Promise.all([
					userApi.getProfile(),
					walletApi.getWallets(),
					twoFactorApi.getStatus(),
				]);
				if (!active) return;

				const profile =
					profileRes.data?.data?.user ??
					profileRes.data?.user ??
					profileRes.data;
				if (profile) {
					setUserName(profile.name || 'Người dùng');
					setUserEmail(profile.email || '');
				}

				const walletList =
					walletsRes.data?.data?.wallets ??
					walletsRes.data?.wallets ??
					walletsRes.data?.data ??
					[];
				setWallets(walletList);
				const defaultWallet = walletList.find((w: any) => w.is_default === 1) || walletList[0];
				if (defaultWallet) {
					setCurrentWalletId(defaultWallet.id);
				}

				const twoFactorData =
					twoFactorRes.data?.data ??
					twoFactorRes.data;
				setIs2FAEnabled(!!twoFactorData?.enabled);
			} catch (error) {
				console.error('Failed to load profile info', error);
			} finally {
				if (active) {
				setLoading(false);
				}
			}
		};
		load();
		return () => {
			active = false;
		};
	}, [userId, user]);

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
			const response = await userApi.updateProfile({ name: editName.trim() });
			const updated = response.data?.data?.user ?? response.data?.user ?? response.data;
			if (updated) {
				setUserName(updated.name || 'Người dùng');
				setUserEmail(updated.email || '');
				await refreshUser();
				setEditVisible(false);
			}
		} catch (error) {
			Alert.alert('Lỗi', getErrorMessage(error, 'Cập nhật thất bại'));
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

	const handleToggle2FA = async (enable: boolean) => {
		try {
			setLoading2FA(true);
			const result = await twoFactorApi.update(enable);
			const payload = result.data?.data ?? result.data;
			setIs2FAEnabled(payload?.enabled ?? enable);
			Alert.alert('Thành công', enable ? 'Đã bật xác thực 2 bước' : 'Đã tắt xác thực 2 bước');
		} catch (error) {
			Alert.alert('Lỗi', getErrorMessage(error, 'Cập nhật thất bại'));
		} finally {
			setLoading2FA(false);
		}
	};

	const onToggle2FA = (value: boolean) => {
		if (value) {
			Alert.alert(
				'Bật xác thực 2 bước',
				'Khi bật xác thực 2 bước, bạn sẽ cần nhập mã xác thực qua email mỗi khi đăng nhập. Bạn có muốn tiếp tục?',
				[
					{ text: 'Hủy', style: 'cancel' },
					{ text: 'Bật', onPress: () => handleToggle2FA(true) },
				]
			);
		} else {
			Alert.alert(
				'Tắt xác thực 2 bước',
				'Bạn có chắc muốn tắt xác thực 2 bước? Tài khoản của bạn sẽ kém an toàn hơn.',
				[
					{ text: 'Hủy', style: 'cancel' },
					{ text: 'Tắt', style: 'destructive', onPress: () => handleToggle2FA(false) },
				]
			);
		}
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
						title="Xác thực 2 bước"
						description={is2FAEnabled ? "Đã bật - Yêu cầu mã xác thực khi đăng nhập" : "Chưa bật - Bảo vệ tài khoản bằng mã xác thực qua email"}
						left={props => <List.Icon {...props} icon="shield-check-outline" />}
						right={() => (
							<Switch
								value={is2FAEnabled}
								onValueChange={onToggle2FA}
								disabled={loading2FA}
							/>
						)}
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
						<Button
							onPress={async () => {
								if (!curPwd || !newPwd || !cfmPwd) {
									Alert.alert('Lỗi', 'Vui lòng điền đầy đủ');
									return;
								}
								if (newPwd.length < 8) {
									Alert.alert('Lỗi', 'Mật khẩu mới phải từ 8 ký tự, có chữ hoa, chữ thường và số');
									return;
								}
								if (newPwd !== cfmPwd) {
									Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp');
									return;
								}
								try {
									setLoading(true);
									const res = await authApi.changePassword({ currentPassword: curPwd, newPassword: newPwd });
									const root = res.data;
									const code = root?.code;
									const message = root?.message || 'Đổi mật khẩu thành công';
									if (code === 'SUCCESS') {
										Alert.alert('Thành công', message);
										setPwdVisible(false);
										setCurPwd('');
										setNewPwd('');
										setCfmPwd('');
									} else {
										Alert.alert('Lỗi', message || 'Đổi mật khẩu thất bại');
									}
								} catch (error: any) {
									Alert.alert('Lỗi', getErrorMessage(error, 'Đổi mật khẩu thất bại'));
								} finally {
									setLoading(false);
								}
							}}
							loading={loading}
						>
							Lưu
						</Button>
					</Dialog.Actions>
				</Dialog>
			</Portal>

			{/* Wallet manager (componentized) */}
			<WalletManagerSheet
				userId={userId ?? 0}
				visible={walletSheetVisible}
				onDismiss={() => setWalletSheetVisible(false)}
				onWalletChanged={(id) => {
					setCurrentWalletId(id);
				}}
			/>

			<CategoryManagerSheet
				userId={userId ?? 0}
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
