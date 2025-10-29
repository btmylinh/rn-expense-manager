// screens/ProfileScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { Avatar, Button, Divider, List, Portal, Dialog, TextInput, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import AppBar from '../../components/AppBar';
import { fakeApi } from '../../services/fakeApi';

export default function ProfileScreen({ navigation }: any) {
	const theme = useAppTheme();
	const [loading, setLoading] = useState(false);
	const [userName, setUserName] = useState<string>('');
	const [userEmail, setUserEmail] = useState<string>('');
	const [editVisible, setEditVisible] = useState(false);
	const [editName, setEditName] = useState('');
	const [editEmail, setEditEmail] = useState('');
	const userId = 1; // Demo user id

	useEffect(() => {
		let mounted = true;
		const load = async () => {
			try {
				setLoading(true);
				const res = await fakeApi.getUser(userId);
				if (mounted && res.success && res.user) {
					setUserName(res.user.name || 'Người dùng');
					setUserEmail(res.user.email || '');
				}
			} finally {
				setLoading(false);
			}
		};
		load();
		return () => {
			mounted = false;
		};
	}, []);

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
			{ text: 'Đăng xuất', style: 'destructive', onPress: () => navigation.replace('Auth') },
		]);
	};

	return (
		<View style={{ flex: 1}}>
			<AppBar title="Hồ sơ" />
			<ScrollView contentContainerStyle={{ padding: theme.spacing(1) }}>
				{/* Header: Avatar + Name + Edit */}
				<View style={{ alignItems: 'center', marginBottom: theme.spacing(3) }}>
					<Avatar.Text size={80} label={initials} style={{ backgroundColor: theme.colors.primary }} color={theme.colors.onPrimary} />
					<Text style={[theme.semantic.typography.h2, { color: theme.colors.onSurface, marginTop: theme.spacing(2) }]}>{userName || 'Người dùng'}</Text>
					{userEmail ? (
						<Text style={[theme.semantic.typography.small, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}>{userEmail}</Text>
					) : null}
					<Button mode="outlined" onPress={openEdit} style={{ marginTop: theme.spacing(2), borderRadius: theme.radius.pill }} icon="pencil">
						Chỉnh sửa
					</Button>
				</View>

				{/* Sections */}
				<List.Section>
					<List.Subheader>Quản lý tài khoản</List.Subheader>
					<List.Item
						title="Thông tin cá nhân"
						description="Xem và cập nhật tên, email"
						left={props => <List.Icon {...props} icon="account-circle-outline" />}
						onPress={openEdit}
					/>
					<Divider />
					<List.Item
						title="Ví của tôi"
						description="Quản lý ví"
						left={props => <List.Icon {...props} icon="wallet-outline" />}
						onPress={() => Alert.alert('Ví của tôi', 'Tính năng sẽ được bổ sung')}
					/>
					<Divider />
					<List.Item
						title="Danh mục của tôi"
						description="Quản lý danh mục thu/chi"
						left={props => <List.Icon {...props} icon="tag-outline" />}
						onPress={() => Alert.alert('Danh mục của tôi', 'Tính năng sẽ được bổ sung')}
					/>
					<Divider />
					<List.Item
						title="Đăng xuất"
						description="Thoát khỏi tài khoản hiện tại"
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
		</View>
	);
}
