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
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.51;

interface OCRGuideModalProps {
  visible: boolean;
  onDismiss: () => void;
  onCapture: () => void;
  onPickFromLibrary: () => void;
}

export default function OCRGuideModal({
  visible,
  onDismiss,
  onCapture,
  onPickFromLibrary,
}: OCRGuideModalProps) {
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
              Quét hóa đơn / Sao kê
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
                name="camera" 
                size={64} 
                color={theme.colors.primary} 
              />
            </View>

            {/* Instruction */}
            <Text style={[styles.instructionText, { color: theme.colors.onSurface }]}>
              Hãy chụp hình hóa đơn, sao kê, hoặc tài liệu có ghi các khoản chi tiêu của bạn.
            </Text>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.outline + '20' }]}>
            <View style={styles.buttonsRow}>
              <Button
                mode="outlined"
                icon="image-outline"
                onPress={onPickFromLibrary}
                style={styles.actionButton}
                buttonColor={theme.colors.surface}
                textColor={theme.colors.primary}
                contentStyle={{ flexDirection: 'row-reverse' }}
              >
                Chọn ảnh
              </Button>
              <Button
                mode="contained"
                icon="camera"
                onPress={onCapture}
                style={styles.actionButton}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                contentStyle={{ flexDirection: 'row-reverse' }}
              >
                Chụp ảnh
              </Button>
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
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  instructionText2: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  tipsContainer: {
    width: '100%',
    marginTop: 'auto',
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
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
});

