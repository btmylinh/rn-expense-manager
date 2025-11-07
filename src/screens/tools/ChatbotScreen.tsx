import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Button, IconButton, Text, TextInput } from 'react-native-paper';
import { FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AppBar from '../../components/AppBar';
import { useAppTheme } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { fakeApi } from '../../services/fakeApi';

type ChatRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
	id: string;
	userId: number;
	role: ChatRole;
	content: string;
	createdAt: string;
	metadata?: Record<string, unknown>;
}

interface ChatResponse {
	userMessage: ChatMessage;
	assistantMessage: ChatMessage;
	suggestions?: string[];
	context?: Record<string, unknown>;
}

interface ChatFaq {
	id: string;
	question: string;
	answer: string;
	tags: string[];
}

export default function ChatbotScreen() {
	const theme = useAppTheme();
	const navigation = useNavigation();
	const { user } = useAuth();
	const userId = user?.id || fakeApi.getCurrentUserId() || 1;
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [typing, setTyping] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [faqs, setFaqs] = useState<ChatFaq[]>([]);
	const [input, setInput] = useState('');
	const [suggestions, setSuggestions] = useState<string[]>([]);
const listRef = useRef<FlatList<ChatMessage>>(null);
const insets = useSafeAreaInsets();
const APP_BAR_HEIGHT = 48;

	const scrollToBottom = useCallback(() => {
		requestAnimationFrame(() => {
			listRef.current?.scrollToEnd({ animated: true });
		});
	}, []);

	const loadInitialData = useCallback(async () => {
		try {
			const [historyRes, faqRes] = await Promise.all([
				fakeApi.getChatHistory(userId),
				fakeApi.getFAQs(),
			]);
			if (historyRes.success) {
				setMessages(historyRes.data as ChatMessage[]);
			}
			if (faqRes.success) {
				setFaqs(faqRes.data as ChatFaq[]);
				setSuggestions((faqRes.data as ChatFaq[]).slice(0, 3).map(faq => faq.question));
			}
		} catch (error) {
			console.error('Failed to load chatbot data', error);
		} finally {
			setLoading(false);
			setTimeout(scrollToBottom, 150);
		}
	}, [scrollToBottom, userId]);

	useEffect(() => {
		loadInitialData();
	}, [loadInitialData]);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const refreshHistory = useCallback(async () => {
		const res = await fakeApi.getChatHistory(userId);
		if (res.success) {
			setMessages(res.data as ChatMessage[]);
		}
	}, [userId]);

	const sendMessage = useCallback(async (content: string) => {
		const trimmed = content.trim();
		if (!trimmed || sending) return;
		setSending(true);
		setTyping(true);
		setInput('');
		const tempMessage: ChatMessage = {
			id: `temp-${Date.now()}`,
			userId,
			role: 'user',
			content: trimmed,
			createdAt: new Date().toISOString(),
		};
		setMessages(prev => [...prev, tempMessage]);
		try {
			const response = await fakeApi.sendChatMessage(userId, trimmed);
			if (response.success) {
				const data = response.data as ChatResponse;
				setSuggestions(data.suggestions || suggestions);
			}
			await refreshHistory();
		} catch (error) {
			console.error('Failed to send chat message', error);
		} finally {
			setTyping(false);
			setSending(false);
		}
	}, [refreshHistory, sending, suggestions, userId]);

	const handleSend = () => {
		sendMessage(input);
	};

	const handleFaqPress = (question: string) => {
		sendMessage(question);
	};

	const renderMessage = ({ item }: { item: ChatMessage }) => {
		const isUser = item.role === 'user';
		return (
			<View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
				<View
					style={[
						styles.messageBubble,
						isUser ? styles.userBubble : styles.assistantBubble,
					]}
				>
					<Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
						{item.content}
					</Text>
				</View>
			</View>
		);
	};

	const suggestionRows = useMemo(() => {
		if (!suggestions.length) return [] as string[][];
		const perRow = Math.ceil(suggestions.length / 2) || 1;
		return [
			suggestions.slice(0, perRow),
			suggestions.slice(perRow)
		].filter(row => row.length > 0);
	}, [suggestions]);

const topPadding = Math.max(insets.top - 6, 0);
const keyboardOffset = useMemo(() => {
	const baseOffset = APP_BAR_HEIGHT + insets.top;
	return Platform.select({ ios: baseOffset, android: APP_BAR_HEIGHT }) ?? APP_BAR_HEIGHT;
}, [insets.top]);

return (
	<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['left', 'right']}>
		<View style={{ paddingTop: topPadding }}>
			<AppBar title="Chatbot tài chính" onBack={() => navigation.goBack()} />
		</View>
			{loading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={{ marginTop: 12, color: theme.colors.onBackground }}>Đang kết nối chatbot...</Text>
				</View>
			) : (
			<KeyboardAvoidingView
				style={styles.keyboardContainer}
				behavior={Platform.select({ ios: 'padding', android: 'height' })}
				keyboardVerticalOffset={keyboardOffset}
				enabled>
					<View style={styles.content}>
						<FlatList
							ref={listRef}
							data={messages}
							renderItem={renderMessage}
							keyExtractor={(item) => item.id}
							contentContainerStyle={styles.listContent}
							ListFooterComponent={typing ? (
								<View style={styles.typingRow}>
									<ActivityIndicator size="small" color={theme.colors.primary} />
									<Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>Chatbot đang phản hồi...</Text>
								</View>
							) : null}
						/>
					</View>
					<View style={[styles.inputBar, { backgroundColor: theme.colors.surface, paddingBottom: Math.max(insets.bottom, 16) }]}>
						<View style={styles.suggestionContainer}>
							{suggestionRows.map((row, rowIndex) => (
								<ScrollView
									horizontal
									key={`suggestion-row-${rowIndex}`}
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.suggestionRow}
								>
									{row.map(suggestion => (
										<Button
											key={`${rowIndex}-${suggestion}`}
											compact
											mode="text"
											onPress={() => handleFaqPress(suggestion)}
											textColor={theme.colors.primary}
											style={styles.suggestionButton}
										>
											{suggestion}
										</Button>
									))}
								</ScrollView>
							))}
						</View>
						<View style={styles.inputRow}>
							<TextInput
								mode="outlined"
								placeholder="Hỏi tôi về chi tiêu, dự báo, tiết kiệm..."
								value={input}
								onChangeText={setInput}
								style={styles.textInput}
								editable={!sending}
								returnKeyType="send"
								onSubmitEditing={handleSend}
							/>
							<IconButton
								mode="contained"
								icon="send"
								onPress={handleSend}
								disabled={sending || !input.trim()}
								style={styles.sendButton}
							/>
						</View>
					</View>
				</KeyboardAvoidingView>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	keyboardContainer: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		paddingTop: 12,
	},
	listContent: {
		paddingBottom: 140,
	},
	messageRow: {
		marginBottom: 10,
		flexDirection: 'row',
	},
	userRow: {
		justifyContent: 'flex-end',
	},
	assistantRow: {
		justifyContent: 'flex-start',
	},
	messageBubble: {
		maxWidth: '80%',
		padding: 12,
		borderRadius: 16,
	},
	userBubble: {
		backgroundColor: '#2563EB',
		borderBottomRightRadius: 2,
	},
	assistantBubble: {
		backgroundColor: '#E3F2FD',
		borderBottomLeftRadius: 2,
	},
	messageText: {
		fontSize: 15,
		lineHeight: 20,
	},
	userText: {
		color: '#fff',
	},
	assistantText: {
		color: '#0B1A39',
	},
	typingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingLeft: 4,
	},
	inputBar: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderColor: 'rgba(0,0,0,0.08)',
		paddingHorizontal: 12,
		paddingTop: 10,
	},
	suggestionContainer: {
		marginBottom: 4,
	},
	suggestionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingBottom: 4,
	},
	suggestionButton: {
		paddingHorizontal: 6,
	},
	inputRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	textInput: {
		flex: 1,
	},
	sendButton: {
		marginBottom: 4,
	},
});

