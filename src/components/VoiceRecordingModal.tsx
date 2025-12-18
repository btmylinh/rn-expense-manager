import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Button } from 'react-native-paper';
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingPresets,
} from 'expo-audio';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

interface VoiceRecordingModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSend: (audioUri: string) => void;
  onCancel?: () => void;
}

export default function VoiceRecordingModal({
  visible,
  onDismiss,
  onSend,
  onCancel,
}: VoiceRecordingModalProps) {
  const theme = useAppTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioUriRef = useRef<string | null>(null);
  
  // Create audio recorder using hook
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Helper function để clear timer an toàn
  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Helper function để start timer an toàn
  const startTimer = () => {
    clearTimer(); // Clear timer cũ trước khi tạo mới
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    if (visible && isRecording && !isPaused) {
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
      pulseAnimation.start();

      // Start timer
      startTimer();

      return () => {
        pulseAnimation.stop();
        clearTimer();
      };
    } else {
      // Dừng timer khi không recording hoặc đang pause
      clearTimer();
    }
  }, [visible, isRecording, isPaused, pulseAnim]);

  useEffect(() => {
    // Reset state when modal opens
    if (visible) {
      // Clear timer trước khi reset
      clearTimer();
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
      audioUriRef.current = null;
      
      // Ensure recorder is stopped and cleaned up before starting new recording
      const cleanupRecorder = async () => {
        if (recorder) {
          const status = recorder.getStatus();
          if (status.isRecording) {
            try {
              await recorder.stop();
              // Đợi recorder hoàn toàn dừng
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
              console.warn('Error stopping recorder during cleanup:', e);
      }
          }
        }
      };
      
      // Cleanup trước, sau đó start recording
      cleanupRecorder().then(() => {
        // Delay nhỏ để đảm bảo recorder đã sẵn sàng
        setTimeout(() => {
      startRecording();
        }, 100);
      });
    } else {
      // Cleanup when modal closes
      clearTimer();
      stopRecording();
    }

    // Cleanup khi component unmount
    return () => {
      clearTimer();
      // Đảm bảo recorder được stop khi unmount
      if (recorder) {
        const status = recorder.getStatus();
        if (status.isRecording) {
          recorder.stop().catch(console.error);
        }
      }
    };
  }, [visible]);

  const startRecording = async () => {
    try {
      // Request permissions
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Cần quyền truy cập', 'Ứng dụng cần quyền truy cập microphone để ghi âm.');
        if (onCancel) onCancel();
        return;
      }

      // Set audio mode
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Đảm bảo recorder được stop và reset hoàn toàn trước khi prepare
      if (recorder) {
        const status = recorder.getStatus();
        // Nếu đang recording, stop trước
        if (status.isRecording) {
          try {
        await recorder.stop();
            // Đợi recorder hoàn toàn dừng
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (e) {
            console.warn('Error stopping recorder:', e);
          }
        }
      }

      // Prepare recorder với retry logic
      let retries = 3;
      let prepared = false;
      
      while (retries > 0 && !prepared) {
        try {
      await recorder.prepareToRecordAsync();
      
          // Đợi recorder sẵn sàng (tăng delay cho Android)
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Kiểm tra status kỹ hơn
          const status = recorder.getStatus();
          if (status.canRecord && !status.isRecording) {
            prepared = true;
          } else {
            retries--;
            if (retries > 0) {
              console.log(`Recorder not ready, retrying... (${retries} left)`);
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        } catch (prepareError) {
          retries--;
          console.warn(`Prepare failed, retrying... (${retries} left):`, prepareError);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          } else {
            throw prepareError;
          }
        }
      }

      if (!prepared) {
        throw new Error('Recorder failed to prepare after retries');
      }
      
      // Kiểm tra lại status trước khi record
      const finalStatus = recorder.getStatus();
      if (!finalStatus.canRecord || finalStatus.isRecording) {
        throw new Error(`Recorder not in valid state: canRecord=${finalStatus.canRecord}, isRecording=${finalStatus.isRecording}`);
      }
      
      // Start recording
      recorder.record();
      
      // Đợi một chút để đảm bảo recording đã bắt đầu
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify recording đã bắt đầu
      const verifyStatus = recorder.getStatus();
      if (!verifyStatus.isRecording) {
        throw new Error('Recording failed to start');
      }
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      // Start timer (sẽ được quản lý bởi useEffect)
      // Không tạo timer ở đây để tránh duplicate
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Lỗi', `Không thể bắt đầu ghi âm: ${error instanceof Error ? error.message : 'Vui lòng thử lại.'}`);
      if (onCancel) onCancel();
    }
  };

  const stopRecording = async () => {
    try {
      // Clear timer trước khi stop
      clearTimer();

      if (recorder) {
        const status = recorder.getStatus();
        if (status.isRecording) {
          try {
        await recorder.stop();
        const uri = recorder.uri;
        audioUriRef.current = uri || null;
          } catch (stopError) {
            console.error('Error stopping recorder:', stopError);
            // Vẫn tiếp tục để cleanup state
          }
        }
      }

      setIsRecording(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = async () => {
    if (isPaused) {
      // Resume recording
      try {
        if (recorder && !recorder.isRecording) {
          recorder.record();
        } else if (!recorder) {
          // If no recorder exists, start new one
          await startRecording();
        }
        setIsPaused(false);
        // Timer sẽ tự động start lại qua useEffect khi isPaused = false
      } catch (error) {
        console.error('Failed to resume recording:', error);
      }
    } else {
      // Pause recording
      try {
        if (recorder && recorder.isRecording) {
          recorder.pause();
        }
        setIsPaused(true);
        // Timer sẽ tự động dừng qua useEffect khi isPaused = true
        clearTimer();
      } catch (error) {
        console.error('Failed to pause recording:', error);
      }
    }
  };

  const handleSend = async () => {
    await stopRecording();
    // Pass audio URI to parent component
    if (audioUriRef.current) {
      onSend(audioUriRef.current);
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy file ghi âm. Vui lòng thử lại.');
    }
  };

  const handleCancel = async () => {
    await stopRecording();
    audioUriRef.current = null;
    if (onCancel) {
      onCancel(); // Quay về VoiceGuideModal
    } else {
      onDismiss(); // Fallback: đóng modal nếu không có onCancel
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.outline + '20' }]}>
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>
              Đang ghi âm
            </Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Recording Icon */}
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.iconBackground,
                  {
                    backgroundColor: isPaused
                      ? theme.colors.outline + '15'
                      : theme.colors.error + '15',
                    transform: [{ scale: isPaused ? 1 : pulseAnim }],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="microphone"
                  size={64}
                  color={isPaused ? theme.colors.outline : theme.colors.error}
                />
              </Animated.View>
            </View>

            {/* Status Text */}

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons
                name={isPaused ? 'pause-circle-outline' : 'record-circle'}
                size={18}
                color={isPaused ? theme.colors.outline : theme.colors.error}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.statusText, { color: isPaused ? theme.colors.outline : theme.colors.error }]}>
                {isPaused ? 'Đã tạm dừng' : 'Đang ghi...'}
              </Text>
            </View>

            {/* Timer */}
            <Text style={[styles.timerText, { color: theme.colors.onSurface }]}>
              {formatTime(recordingTime)}
            </Text>

            {/* Waveform (Placeholder) */}
            <View style={styles.waveformContainer}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.waveformBar,
                    {
                      backgroundColor: isPaused ? theme.colors.outline : theme.colors.primary,
                      height: isPaused ? 20 : 10 + Math.random() * 30,
                      opacity: isPaused ? 0.3 : pulseAnim.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0.4, 1],
                      }),
                    },
                  ]}
                />
              ))}
            </View>

            {/* Helper Text */}
            <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
              {isPaused
                ? 'Nhấn tiếp tục để tiếp tục ghi âm'
                : 'Nói rõ ràng các khoản chi tiêu của bạn'}
            </Text>
          </View>

          {/* Footer Controls */}
          <View style={[styles.footer, { borderTopColor: theme.colors.outline + '20' }]}>
            <View style={styles.controlsRow}>
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={handleCancel}
                style={[
                  styles.controlButton,
                  styles.iconButton,
                  { backgroundColor: theme.colors.error + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name="close-circle-outline"
                  size={32}
                  color={theme.colors.error}
                />
              </TouchableOpacity>

              {/* Pause/Resume Button */}
              <TouchableOpacity
                onPress={handlePause}
                style={[
                  styles.controlButton,
                  styles.iconButton,
                  { backgroundColor: theme.colors.primary + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name={isPaused ? "play" : "pause"}
                  size={32}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>

              {/* Send Button */}
              <TouchableOpacity
                onPress={handleSend}
                style={[
                  styles.controlButton,
                  styles.iconButton,
                  { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: MODAL_HEIGHT,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    marginTop: 24,
    width: 100,
    height: 100,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 32,
    fontFamily: 'monospace',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 24,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    paddingVertical: 0,
  },
  pauseButton: {
    // Additional styles if needed
  },
});

