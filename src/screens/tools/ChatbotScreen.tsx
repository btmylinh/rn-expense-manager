import React, { useEffect, useState, useRef } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { chatApi } from '../../api/chatApi';
import { Snackbar, ActivityIndicator } from 'react-native-paper';
import AppBar from '../../components/AppBar';
import { getErrorMessage } from '../../utils/errorHandler';

interface Message {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	created_at: string;
}

interface FAQ {
	id: string;
	question: string;
	answer: string;
	tags: string[];
}

/**
 * ChatbotScreen - Frontend chỉ hiển thị chat, FAQ buttons, gửi question
 * KHÔNG xử lý AI - Backend là "não"
 */
export default function ChatbotScreen() {
	const theme = useAppTheme();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const [messages, setMessages] = useState<Message[]>([]);
	const [faqs, setFaqs] = useState<FAQ[]>([]);
	const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
	const [showFaqs, setShowFaqs] = useState(true);
	const [inputText, setInputText] = useState('');
	const [loading, setLoading] = useState(false);
	const [loadingHistory, setLoadingHistory] = useState(true);
	const [snack, setSnack] = useState('');
	const scrollViewRef = useRef<ScrollView>(null);

	// Load chat history và FAQs khi mount
	useEffect(() => {
		loadInitialData();
	}, []);

	const loadInitialData = async () => {
		try {
			setLoadingHistory(true);
			const [historyRes, faqsRes] = await Promise.all([
				// Lấy lịch sử gần nhất
				chatApi.getHistory({ limit: 50, sortOrder: 'DESC' }),
				chatApi.getFAQs(),
			]);

			// Handle history
			if (historyRes.data?.code === 'SUCCESS') {
				const historyMessages = historyRes.data.data?.messages || [];
				setMessages(sortMessagesChronologically(historyMessages));
			}

			// Handle FAQs
			if (faqsRes.data?.code === 'SUCCESS') {
				const faqsData = faqsRes.data.data || [];
				setFaqs(faqsData);
			}
		} catch (error: any) {
			// Log nhẹ để tránh làm người dùng thấy màn hình lỗi đỏ trong dev
			console.warn('Failed to load initial data:', error);
			setSnack(getErrorMessage(error, 'Không thể tải dữ liệu'));
			// Nếu lỗi auth, clear messages để tránh hiển thị dữ liệu cũ
			if (error?.response?.status === 401 || error?.response?.status === 403) {
				setMessages([]);
			}
		} finally {
			setLoadingHistory(false);
		}
	};

	const sortMessagesChronologically = (list: Message[]): Message[] => {
		return [...list].sort(
			(a, b) =>
				new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
		);
	};

	const sendMessage = async (question: string) => {
		if (!question.trim() || loading) return;

		const userMessage: Message = {
			id: `temp-${Date.now()}`,
			role: 'user',
			content: question.trim(),
			created_at: new Date().toISOString(),
		};

		// Add user message immediately (optimistic update)
		setMessages(prev => [...prev, userMessage]);
		setInputText('');
		setLoading(true);

		// Scroll to bottom
		setTimeout(() => {
			scrollViewRef.current?.scrollToEnd({ animated: true });
		}, 100);

		try {
			const response = await chatApi.sendMessage({
				content: question.trim(),
			});

			if (response.data?.code === 'SUCCESS') {
				const data = response.data.data;

				// Sau khi gửi thành công, reload history từ server để đồng bộ id/metadata
				try {
					const historyRes = await chatApi.getHistory({ limit: 50, sortOrder: 'DESC' });
					if (historyRes.data?.code === 'SUCCESS') {
						const historyMessages = historyRes.data.data?.messages || [];
						setMessages(sortMessagesChronologically(historyMessages));
					} else {
						// Nếu load history lỗi, fallback giữ lại user + answer tối thiểu
						setMessages(prev => {
							const filtered = prev.filter(m => m.id !== userMessage.id);
							const assistantMessage: Message = {
								id: `assistant-${Date.now()}`,
								role: 'assistant',
								content: data.answer || '',
								created_at: new Date().toISOString(),
							};
							return [...filtered, userMessage, assistantMessage];
						});
					}
				} catch (historyError) {
					console.error('Failed to reload chat history after send:', historyError);
					// Fallback giống trên khi không lấy được lịch sử thực tế
					setMessages(prev => {
						const filtered = prev.filter(m => m.id !== userMessage.id);
						const assistantMessage: Message = {
							id: `assistant-${Date.now()}`,
							role: 'assistant',
							content: data.answer || '',
							created_at: new Date().toISOString(),
						};
						return [...filtered, userMessage, assistantMessage];
					});
				}

				// Update suggested questions
				if (data.suggestedQuestions && Array.isArray(data.suggestedQuestions)) {
					setSuggestedQuestions(data.suggestedQuestions);
				}

				// Scroll to bottom
				setTimeout(() => {
					scrollViewRef.current?.scrollToEnd({ animated: true });
				}, 100);
			} else {
				// Handle error response
				setSnack(response.data?.message || 'Có lỗi xảy ra');
				// Remove temp message on error
				setMessages(prev => prev.filter(m => m.id !== userMessage.id));
			}
		} catch (error) {
			// Log nhẹ, UI sẽ hiển thị lỗi qua Snackbar
			console.warn('Failed to send message:', error);
			setSnack(getErrorMessage(error, 'Không thể gửi tin nhắn'));
			// Remove temp message on error
			setMessages(prev => prev.filter(m => m.id !== userMessage.id));
		} finally {
			setLoading(false);
		}
	};

	const handleSend = () => {
		if (inputText.trim()) {
			sendMessage(inputText);
		}
	};

	const handleFAQPress = (faq: FAQ) => {
		// Gửi question từ FAQ
		sendMessage(faq.question);
	};

	const handleSuggestionPress = (suggestion: string) => {
		sendMessage(suggestion);
	};

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: theme.colors.background,
					paddingBottom: Math.max(insets.bottom, 12),
				},
			]}
		>
			<AppBar title="Trợ lý tài chính" onBack={() => navigation.goBack()} />

			{loadingHistory ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
						Đang tải...
					</Text>
				</View>
			) : (
				<>
					{/* Chat Messages */}
					<ScrollView
						ref={scrollViewRef}
						style={styles.messagesContainer}
						contentContainerStyle={styles.messagesContent}
						onContentSizeChange={() => {
							scrollViewRef.current?.scrollToEnd({ animated: true });
						}}
					>
						{messages.map((message) => (
							<View
								key={message.id}
								style={[
									styles.messageWrapper,
									message.role === 'user' ? styles.userMessageWrapper : styles.assistantMessageWrapper,
								]}
							>
								<View
									style={[
										styles.messageBubble,
										message.role === 'user'
											? { backgroundColor: theme.colors.primary }
											: { backgroundColor: theme.colors.surfaceVariant },
									]}
								>
									<Text
										style={[
											styles.messageText,
											message.role === 'user'
												? { color: '#fff' }
												: { color: theme.colors.onSurfaceVariant },
										]}
									>
										{message.content}
									</Text>
								</View>
							</View>
						))}

						{loading && (
							<View style={styles.assistantMessageWrapper}>
								<View style={[styles.messageBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
									<ActivityIndicator size="small" color={theme.colors.primary} />
								</View>
							</View>
						)}
					</ScrollView>

					{/* FAQ near input để dễ thấy (có thể ẩn/hiện) */}
					{faqs.length > 0 && showFaqs && (
						<View style={styles.faqContainerInMessages}>
							<View style={styles.faqHeaderRow}>
								<Text style={[styles.faqSubtitle, { color: theme.colors.onSurfaceVariant }]}>
									Câu hỏi thường gặp:
								</Text>
								<TouchableOpacity onPress={() => setShowFaqs(false)}>
									<Text style={[styles.faqHideText, { color: theme.colors.onSurfaceVariant }]}>
										Ẩn
									</Text>
								</TouchableOpacity>
							</View>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.faqScrollContent}
							>
								{faqs.slice(0, 8).map((faq) => (
									<TouchableOpacity
										key={faq.id}
										style={[styles.faqButtonSmall, { backgroundColor: theme.colors.primaryContainer }]}
										onPress={() => handleFAQPress(faq)}
									>
										<Text style={[styles.faqButtonTextSmall, { color: theme.colors.onPrimaryContainer }]}>
											{faq.question}
										</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
						</View>
					)}

					{/* Nút hiện lại FAQ khi đã ẩn */}
					{faqs.length > 0 && !showFaqs && (
						<TouchableOpacity
							style={styles.faqShowButton}
							onPress={() => setShowFaqs(true)}
						>
							<Text style={[styles.faqShowText, { color: theme.colors.primary }]}>
								Hiện câu hỏi thường gặp
							</Text>
						</TouchableOpacity>
					)}
					{/* Input Area */}
					<KeyboardAvoidingView
						behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
						keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
					>
						<View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
							<TextInput
								style={[styles.input, { color: theme.colors.onSurface }]}
								placeholder="Nhập câu hỏi..."
								placeholderTextColor={theme.colors.onSurfaceVariant}
								value={inputText}
								onChangeText={setInputText}
								multiline
								editable={!loading}
								onSubmitEditing={handleSend}
							/>
							<TouchableOpacity
								style={[
									styles.sendButton,
									{ backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.surfaceVariant },
								]}
								onPress={handleSend}
								disabled={!inputText.trim() || loading}
							>
								<Text
									style={[
										styles.sendButtonText,
										{ color: inputText.trim() ? '#fff' : theme.colors.onSurfaceVariant },
									]}
								>
									Gửi
								</Text>
							</TouchableOpacity>
						</View>
					</KeyboardAvoidingView>
				</>
			)}

			<Snackbar
				visible={Boolean(snack)}
				onDismiss={() => setSnack('')}
				duration={3000}
				style={{ backgroundColor: theme.colors.errorContainer }}
			>
				<Text style={{ color: theme.colors.onErrorContainer }}>{snack}</Text>
			</Snackbar>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 16,
		fontSize: 14,
	},
	faqContainer: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e0e0e0',
		backgroundColor: '#f9f9f9',
	},
	faqTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 12,
	},
	faqScroll: {
		flexDirection: 'row',
	},
	faqScrollContent: {
		paddingRight: 16,
	},
	faqButton: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 20,
		marginRight: 8,
		elevation: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	faqButtonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	faqContainerInMessages: {
		padding: 12,
		marginBottom: 16,
		backgroundColor: '#f5f5f5',
		borderRadius: 12,
		marginHorizontal: 16,
	},
	faqSubtitle: {
		fontSize: 13,
		fontWeight: '600',
		marginBottom: 8,
	},
	faqHeaderRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	faqHideText: {
		fontSize: 12,
		textDecorationLine: 'underline',
	},
	faqShowButton: {
		alignSelf: 'flex-start',
		marginHorizontal: 16,
		marginBottom: 8,
	},
	faqShowText: {
		fontSize: 12,
		textDecorationLine: 'underline',
	},
	faqButtonSmall: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginRight: 6,
		marginBottom: 4,
	},
	faqButtonTextSmall: {
		fontSize: 12,
		fontWeight: '500',
	},
	messagesContainer: {
		flex: 1,
	},
	messagesContent: {
		padding: 16,
	},
	messageWrapper: {
		marginBottom: 12,
	},
	userMessageWrapper: {
		alignItems: 'flex-end',
	},
	assistantMessageWrapper: {
		alignItems: 'flex-start',
	},
	messageBubble: {
		maxWidth: '80%',
		padding: 12,
		borderRadius: 16,
	},
	messageText: {
		fontSize: 15,
		lineHeight: 20,
	},
	suggestionsContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0',
	},
	suggestionButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		marginRight: 8,
	},
	suggestionText: {
		fontSize: 13,
	},
	inputContainer: {
		flexDirection: 'row',
		padding: 12,
		alignItems: 'flex-end',
		borderTopWidth: 1,
		borderTopColor: '#e0e0e0',
	},
	input: {
		flex: 1,
		minHeight: 40,
		maxHeight: 100,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 20,
		backgroundColor: '#f5f5f5',
		marginRight: 8,
		fontSize: 15,
	},
	sendButton: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 20,
	},
	sendButtonText: {
		fontSize: 15,
		fontWeight: '600',
	},
});
