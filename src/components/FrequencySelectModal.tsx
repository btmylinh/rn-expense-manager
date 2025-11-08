import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface FrequencyOption {
	value: FrequencyType;
	label: string;
	icon: string;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
	{ value: 'daily', label: 'Hàng ngày', icon: 'calendar-today' },
	{ value: 'weekly', label: 'Hàng tuần', icon: 'calendar-week' },
	{ value: 'monthly', label: 'Hàng tháng', icon: 'calendar-month' },
	{ value: 'yearly', label: 'Hàng năm', icon: 'calendar-range' },
];

interface FrequencySelectModalProps {
	visible: boolean;
	selectedValue?: FrequencyType;
	onDismiss: () => void;
	onSelect: (value: FrequencyType) => void;
	title?: string;
}

export default function FrequencySelectModal({ 
	visible, 
	selectedValue, 
	onDismiss, 
	onSelect, 
	title = 'Chọn tần suất'
}: FrequencySelectModalProps) {
	const theme = useAppTheme();

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
			<TouchableWithoutFeedback onPress={onDismiss}>
				<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
			</TouchableWithoutFeedback>
			<View style={styles.bottomSheet}>
				<Text style={styles.bottomSheetTitle}>{title}</Text>
				<FlatList
					data={FREQUENCY_OPTIONS}
					keyExtractor={(item) => item.value}
					renderItem={({ item }) => (
						<TouchableOpacity
							onPress={() => {
								onSelect(item.value);
								onDismiss();
							}}
							style={styles.bottomSheetItem}
						>
							<View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
								<MaterialCommunityIcons 
									name={item.icon as any} 
									size={20} 
									color={theme.colors.onPrimaryContainer} 
								/>
							</View>
							<Text style={styles.bottomSheetItemText}>
								{item.label}
							</Text>
							{selectedValue === item.value && (
								<MaterialCommunityIcons 
									name="check" 
									size={20} 
									color={theme.colors.primary} 
									style={{ marginLeft: 'auto' }} 
								/>
							)}
						</TouchableOpacity>
					)}
				/>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	bottomSheet: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: '#FFF',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingBottom: 22,
		height: '50%',
	},
	bottomSheetTitle: {
		fontSize: 17,
		fontWeight: '600',
		marginBottom: 12,
	},
	bottomSheetItem: {
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconWrap: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	bottomSheetItemText: {
		marginLeft: 10,
		fontSize: 16,
		color: '#222',
		flex: 1,
	},
});

