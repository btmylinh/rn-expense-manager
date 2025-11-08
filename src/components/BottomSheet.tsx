// components/BottomSheet.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { useAppTheme } from '../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BottomSheetProps {
	visible: boolean;
	onDismiss: () => void;
	children: React.ReactNode;
	title?: string | React.ReactNode;
	titleIcon?: string;
	/**
	 * Chiều cao của bottom sheet:
	 * - "auto": Tự động điều chỉnh theo nội dung, maxHeight = 90% màn hình
	 * - "70%": Chiều cao cố định theo phần trăm màn hình (ví dụ: "70%", "50%")
	 * - 500: Chiều cao cố định theo pixel (ví dụ: 500, 600)
	 */
	height?: number | string;
	showHandle?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BottomSheet({
	visible,
	onDismiss,
	children,
	title,
	titleIcon,
	height = 'auto',
	showHandle = true,
}: BottomSheetProps) {
	const theme = useAppTheme();
	const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
	const backdropOpacity = React.useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (visible) {
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		} else {
			Animated.parallel([
				Animated.timing(slideAnim, {
					toValue: SCREEN_HEIGHT,
					duration: 250,
					useNativeDriver: true,
				}),
				Animated.timing(backdropOpacity, {
					toValue: 0,
					duration: 250,
					useNativeDriver: true,
				}),
			]).start();
		}
	}, [visible]);

	const handleDismiss = () => {
		Animated.parallel([
			Animated.timing(slideAnim, {
				toValue: SCREEN_HEIGHT,
				duration: 250,
				useNativeDriver: true,
			}),
			Animated.timing(backdropOpacity, {
				toValue: 0,
				duration: 250,
				useNativeDriver: true,
			}),
		]).start(() => {
			onDismiss();
		});
	};


	const calculateHeight = (): number | undefined => {
		if (height === 'auto') {
			return undefined; 
		}

		if (typeof height === 'number') {
			return height;
		}

		if (typeof height === 'string') {
			const percentageMatch = height.match(/^(\d+(?:\.\d+)?)%$/);
			if (percentageMatch) {
				const percentage = parseFloat(percentageMatch[1]);
				return (SCREEN_HEIGHT * percentage) / 100;
			}

			const numericValue = parseFloat(height);
			if (!isNaN(numericValue)) {
				return numericValue;
			}
		}

		return SCREEN_HEIGHT * 0.9;
	};

	/**
	 * Tính toán maxHeight cho trường hợp "auto"
	 * @returns MaxHeight tính bằng pixel
	 */
	const calculateMaxHeight = (): number => {
		// Nếu là "auto": maxHeight = 90% màn hình
		if (height === 'auto') {
			return SCREEN_HEIGHT * 0.9;
		}

		// Các trường hợp khác: maxHeight = height đã tính
		const calculatedHeight = calculateHeight();
		return calculatedHeight || SCREEN_HEIGHT * 0.9;
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="none"
			onRequestClose={handleDismiss}
			statusBarTranslucent
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.container}
			>
				{/* Backdrop */}
				<Animated.View
					style={[
						styles.backdrop,
						{
							opacity: backdropOpacity,
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
						},
					]}
				>
					<TouchableOpacity
						style={StyleSheet.absoluteFill}
						activeOpacity={1}
						onPress={handleDismiss}
					/>
				</Animated.View>

				{/* Bottom Sheet */}
				<Animated.View
					style={[
						styles.bottomSheet,
						{
							backgroundColor: theme.colors.surface,
							transform: [{ translateY: slideAnim }],

							height: calculateHeight(),
							maxHeight: calculateMaxHeight(),
						},
					]}
				>
					{/* Handle */}
					{showHandle && (
						<View style={styles.handleContainer}>
							<View style={[styles.handle, { backgroundColor: theme.colors.onSurfaceVariant + '40' }]} />
						</View>
					)}

					{/* Header */}
					{(title || titleIcon) && (
						<View style={[styles.header, { borderBottomColor: theme.colors.outline + '30' }]}>
							<View style={styles.headerContent}>
								{titleIcon && (
									<MaterialCommunityIcons
										name={titleIcon as any}
										size={24}
										color={theme.colors.primary}
										style={{ marginRight: 8 }}
									/>
								)}
								{title && (
									<View style={styles.titleContainer}>
										{typeof title === 'string' ? (
											<Text style={[styles.title, { color: theme.colors.onSurface }]}>
												{title}
											</Text>
										) : (
											title
										)}
									</View>
								)}
							</View>
							<TouchableOpacity
								onPress={handleDismiss}
								style={styles.closeButton}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<MaterialCommunityIcons
									name="close"
									size={24}
									color={theme.colors.onSurfaceVariant}
								/>
							</TouchableOpacity>
						</View>
					)}

					{/* Content */}
					<View style={styles.content}>
						{children}
					</View>
				</Animated.View>
			</KeyboardAvoidingView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
	},
	bottomSheet: {
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		paddingBottom: 0,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -2 },
		shadowOpacity: 0.25,
		shadowRadius: 10,
		elevation: 10,
		minHeight: 200,
	},
	handleContainer: {
		alignItems: 'center',
		paddingTop: 12,
		paddingBottom: 8,
	},
	handle: {
		width: 40,
		height: 4,
		borderRadius: 2,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
		borderBottomWidth: 1,
	},
	headerContent: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	titleContainer: {
		flex: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: '700',
	},
	closeButton: {
		padding: 4,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 4,
	},
});

