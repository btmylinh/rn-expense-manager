import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SegmentedButtons } from 'react-native-paper';
import { useAppTheme, getIconColor } from '../theme';

interface CategorySelectModalProps {
	visible: boolean;
	categories: Array<{ id: number; name: string; type: number; icon?: string }>;
	selectedId?: number;
	onDismiss: () => void;
	onSelect: (id: number) => void;
	title?: string;
	mode?: 'budget' | 'default';
	initialType?: 'expense' | 'income';
}

export default function CategorySelectModal({ 
	visible, 
	categories, 
	selectedId, 
	onDismiss, 
	onSelect, 
	title = 'Chọn danh mục',
	mode = 'default',
	initialType = 'expense'
}: CategorySelectModalProps) {
	const theme = useAppTheme();
	const [filterType, setFilterType] = useState<'expense' | 'income'>(initialType);
	
	const filteredCategories = mode === 'budget' 
		? categories.filter(c => c.type === 2) // chỉ chi tiêu
		: categories.filter(c => c.type === (filterType === 'income' ? 1 : 2));

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
			<TouchableWithoutFeedback onPress={onDismiss}>
				<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
			</TouchableWithoutFeedback>
			<View style={styles.bottomSheet}>
				<Text style={styles.bottomSheetTitle}>{title}</Text>
				{mode === 'default' && (
					<View style={styles.segmentedContainer}>
						<SegmentedButtons
							value={filterType}
							onValueChange={(v: any) => setFilterType(v)}
							buttons={[
								{ value: 'expense', label: 'Chi tiêu' },
								{ value: 'income', label: 'Thu nhập' }
							]}
						/>
					</View>
				)}
				<FlatList
					data={filteredCategories}
					keyExtractor={(c) => String(c.id)}
					numColumns={1}
					renderItem={({ item: c }) => (
						<TouchableOpacity
							onPress={() => {
								onSelect(c.id);
								onDismiss();
							}}
							style={styles.bottomSheetItem}
						>
							<View style={[styles.catIconWrap, { backgroundColor: getIconColor(c.icon, theme) + '22' }]}>
								<MaterialCommunityIcons name={c.icon as any || 'tag-outline'} size={20} color={getIconColor(c.icon, theme)} />
							</View>
							<Text style={styles.bottomSheetItemText}>{c.name}</Text>
							{selectedId === c.id && (
								<MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} style={{ marginLeft: 'auto' }} />
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
		height: '70%',
	},
	bottomSheetTitle: {
		fontSize: 17,
		fontWeight: '600',
		marginBottom: 12,
	},
	segmentedContainer: {
		marginBottom: 12,
	},
	bottomSheetItem: {
		paddingVertical: 12,
		flexDirection: 'row',
		alignItems: 'center',
	},
	catIconWrap: {
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

