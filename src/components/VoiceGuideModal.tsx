import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Button } from 'react-native-paper';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.65;

interface VoiceGuideModalProps {
  visible: boolean;
  onDismiss: () => void;
  onStart: () => void;
}

export default function VoiceGuideModal({
  visible,
  onDismiss,
  onStart,
}: VoiceGuideModalProps) {
  const theme = useAppTheme();

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
              Nhập bằng giọng nói
            </Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <MaterialCommunityIcons 
                name="microphone" 
                size={64} 
                color={theme.colors.primary} 
              />
            </View>

            {/* Instruction */}
            <Text style={[styles.instructionText, { color: theme.colors.onSurface }]}>
              Hãy đọc liên tục các khoảng chi tiêu của bạn
            </Text>

            {/* Example */}
            <View style={[styles.exampleContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
             
              <View style={styles.exampleContent}>
                <Text style={[styles.exampleLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Ví dụ:
                </Text>
                <Text style={[styles.exampleText, { color: theme.colors.onSurface }]}>
                  "Mua cà phê 35 nghìn, ăn sáng 45 nghìn, nạp điện thoại 100 nghìn"
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.outline + '20' }]}>
            <Button
              mode="contained"
              icon="microphone"
              onPress={onStart}
              style={styles.startButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
            >
              Bắt đầu ghi âm
            </Button>
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
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  exampleContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  exampleContent: {
    flex: 1,
  },
  exampleLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tipsContainer: {
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 18,
    marginRight: 8,
    color: '#64748B',
  },
  tipText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  startButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
});

