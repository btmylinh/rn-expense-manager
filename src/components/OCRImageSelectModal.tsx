import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme';
import { Button } from 'react-native-paper';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

interface OCRImageSelectModalProps {
  visible: boolean;
  onDismiss: () => void;
  imageUri: string | null;
  onRetake: () => void;
  onReselect: () => void;
  onSend: () => void;
}

export default function OCRImageSelectModal({
  visible,
  onDismiss,
  imageUri,
  onRetake,
  onReselect,
  onSend,
}: OCRImageSelectModalProps) {
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
              Xem trước ảnh
            </Text>
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {imageUri ? (
              <>
                {/* Image Preview */}
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: imageUri }} 
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Helper Text */}
                <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
                  Kiểm tra ảnh có rõ nét và đầy đủ nội dung không
                </Text>
              </>
            ) : (
              <View style={styles.placeholderContainer}>
                <MaterialCommunityIcons 
                  name="image-outline" 
                  size={64} 
                  color={theme.colors.outline} 
                />
                <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
                  Chưa có ảnh
                </Text>
              </View>
            )}
          </View>

          {/* Footer Controls */}
          <View style={[styles.footer, { borderTopColor: theme.colors.outline + '20' }]}>
            <View style={styles.controlsRow}>
              {/* Retake/Reselect Button */}
              <Button
                mode="outlined"
                onPress={onRetake}
                style={styles.actionButton}
                buttonColor={theme.colors.surface}
                textColor={theme.colors.primary}
                icon="camera"
              >
                Chụp lại
              </Button>
              <Button
                mode="outlined"
                onPress={onReselect}
                style={styles.actionButton}
                buttonColor={theme.colors.surface}
                textColor={theme.colors.primary}
                icon="image"
              >
                Chọn lại
              </Button>
            </View>
            {/* Send Button */}
            <Button
              mode="contained"
              onPress={onSend}
              style={styles.sendButton}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              disabled={!imageUri}
              icon="send"
            >
              Gửi ảnh
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
    padding: 16,
  },
  imageContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    marginTop: 16,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 4,
  },
  sendButton: {
    borderRadius: 12,
    paddingVertical: 4,
  },
});

