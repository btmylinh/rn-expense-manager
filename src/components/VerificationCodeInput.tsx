// components/VerificationCodeInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, HelperText, Button, Text } from 'react-native-paper';
import { useAppTheme } from '../theme';

interface VerificationCodeInputProps {
	email: string;
	code: string;
	onCodeChange: (code: string) => void;
	onSubmit: () => void;
	onResend: () => void;
	loading?: boolean;
	resending?: boolean;
	error?: string | null;
	label?: string;
	submitLabel?: string;
	resendLabel?: string;
	autoFocus?: boolean;
}

export default function VerificationCodeInput({
	email,
	code,
	onCodeChange,
	onSubmit,
	onResend,
	loading = false,
	resending = false,
	error = null,
	label = 'Mã xác thực',
	submitLabel = 'Xác thực',
	resendLabel = 'Gửi lại mã',
	autoFocus = true,
}: VerificationCodeInputProps) {
	const theme = useAppTheme();
	const [countdown, setCountdown] = useState(60); // 1 phút = 60 giây
	const [canResend, setCanResend] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const wasResendingRef = useRef(false);

	// Quản lý đếm ngược
	useEffect(() => {
		if (countdown > 0 && !canResend) {
			intervalRef.current = setInterval(() => {
				setCountdown((prev) => {
					if (prev <= 1) {
						setCanResend(true);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [countdown, canResend]);

	// Reset countdown khi resend thành công
	useEffect(() => {
		// Nếu vừa resend xong (resending chuyển từ true -> false)
		if (wasResendingRef.current && !resending && canResend) {
			setCountdown(60);
			setCanResend(false);
		}
		wasResendingRef.current = resending;
	}, [resending, canResend]);

	// Cập nhật countdown khi resend
	const handleResend = async () => {
		if (canResend && !resending) {
			await onResend();
		}
	};

	// Format countdown: MM:SS
	const formatCountdown = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<View style={styles.container}>
			{/* Email display */}
			<Text style={[styles.emailText, { color: theme.colors.onSurfaceVariant }]}>
				Chúng tôi đã gửi mã xác thực 6 chữ số đến email{'\n'}
				<Text style={{ fontWeight: '600', color: theme.colors.onBackground }}>{email}</Text>
			</Text>

			{/* Code Input */}
			<TextInput
				label={label}
				value={code}
				onChangeText={onCodeChange}
				mode="outlined"
				style={styles.input}
				keyboardType="number-pad"
				maxLength={6}
				left={<TextInput.Icon icon="shield-check-outline" />}
				error={!!error && code.length > 0}
				autoFocus={autoFocus}
			/>
			{!!error && (
				<HelperText type="error" visible={!!error} style={styles.errorText}>
					{error}
				</HelperText>
			)}

			{/* Submit Button */}
			<Button
				mode="contained"
				onPress={onSubmit}
				loading={loading}
				disabled={loading || !code || code.length !== 6}
				style={styles.submitButton}
				contentStyle={styles.submitButtonContent}
			>
				{submitLabel}
			</Button>

			{/* Resend Button with Countdown */}
			<View style={styles.resendContainer}>
				{!canResend ? (
					<Text style={[styles.countdownText, { color: theme.colors.onSurfaceVariant }]}>
						Gửi lại mã sau {formatCountdown(countdown)}
					</Text>
				) : (
					<Button
						mode="text"
						onPress={handleResend}
						loading={resending}
						disabled={resending}
						style={styles.resendButton}
						labelStyle={{ fontSize: 14 }}
					>
						{resendLabel}
					</Button>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	emailText: {
		fontSize: 15,
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 24,
	},
	input: {
		marginBottom: 4,
	},
	errorText: {
		marginTop: -4,
		marginBottom: 8,
	},
	submitButton: {
		borderRadius: 12,
		marginTop: 8,
	},
	submitButtonContent: {
		paddingVertical: 8,
	},
	resendContainer: {
		marginTop: 16,
		alignItems: 'center',
		minHeight: 40,
		justifyContent: 'center',
	},
	resendButton: {
		// Button styles
	},
	countdownText: {
		fontSize: 14,
		textAlign: 'center',
	},
});

