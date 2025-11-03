import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Dimensions,
    Animated,
    Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AIProcessingModalProps {
    visible: boolean;
    onRequestClose?: () => void;
    type?: 'text' | 'voice' | 'image';
    imageUri?: string | null;
}

export default function AIProcessingModal({
    visible,
    onRequestClose,
    type = 'text',
    imageUri = null,
}: AIProcessingModalProps) {
    const theme = useAppTheme();
    const [currentStep, setCurrentStep] = useState(0);
    const [rotateAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));

    const steps = type === 'voice'
        ? [
            'Đang chuyển đổi giọng nói...',
            'Nhận diện giao dịch...',
            'Xác định danh mục...',
            'Hoàn tất xử lý...'
        ]
        : type === 'image'
            ? [
                'Đang nhận diện văn bản...',
                'Phân tích nội dung hóa đơn...',
                'Nhận diện giao dịch...',
                'Hoàn tất xử lý...'
            ]
            : [
                'Đang phân tích tin nhắn...',
                'Nhận diện giao dịch...',
                'Xác định danh mục...',
                'Hoàn tất xử lý...'
            ];

    useEffect(() => {
        if (visible) {
            // Reset animation values
            setCurrentStep(0);
            rotateAnim.setValue(0);
            pulseAnim.setValue(1);

            // Start rotation animation
            const rotateAnimation = Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            );

            // Start pulse animation
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );

            rotateAnimation.start();
            pulseAnimation.start();

            // Step progression
            const stepInterval = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev < steps.length - 1) {
                        return prev + 1;
                    }
                    return prev;
                });
            }, 600); // Change step every 600ms

            return () => {
                clearInterval(stepInterval);
                rotateAnimation.stop();
                pulseAnimation.stop();
            };
        }
    }, [visible, rotateAnim, pulseAnim]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onRequestClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                    {/* Image Preview for image type */}
                    {type === 'image' && imageUri && (
                        <View style={styles.imagePreviewContainer}>
                            <Image
                                source={{ uri: imageUri }}
                                style={styles.previewImage}
                                resizeMode="cover"
                            />
                        </View>
                    )}

                    {/* AI Icon with animations */}
                    <View style={styles.iconContainer}>
                        <Animated.View
                            style={[
                                styles.iconBackground,
                                {
                                    backgroundColor: theme.colors.primary + '20',
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.iconWrapper,
                                    { transform: [{ rotate }] },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={"robot-outline"}
                                    size={40}
                                    color={theme.colors.primary}
                                />
                            </Animated.View>
                        </Animated.View>
                    </View>

                    {/* AI Brand */}
                    <Text style={[styles.brandText, { color: theme.colors.primary }]}>
                        {type === 'image'
                            ? 'AI đang phân tích nội dung hóa đơn của bạn...'
                            : type === 'voice'
                                ? 'AI đang xử lý giọng nói của bạn...'
                                : 'AI đang xử lý...'}
                    </Text>

                    {/* Progress Dots */}
                    <View style={styles.dotsContainer}>
                        {steps.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: index <= currentStep
                                            ? theme.colors.primary
                                            : theme.colors.outline,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Current Step */}
                    <Text style={[styles.stepText, { color: theme.colors.onSurface }]}>
                        {steps[currentStep]}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: SCREEN_WIDTH * 0.8,
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        maxHeight: '80%',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#000',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconBackground: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandText: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 28,
        textAlign: 'center',
    },
    stepText: {
        fontSize: 14,
        marginBottom: 0,
        textAlign: 'center',
        minHeight: 14, // Prevent layout shift
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    loadingBars: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    loadingBar: {
        width: 4,
        height: 20,
        borderRadius: 2,
        marginHorizontal: 2,
    },
    subtitleText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
