import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { List, Switch, Divider, Card, Text, Button } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../theme';
import AppBar from '../../components/AppBar';
import { fakeApi } from '../../services/fakeApi';
import { useAuth } from '../../contexts/AuthContext';

interface StreakSettingsScreenProps {
  navigation: any;
}

export default function StreakSettingsScreen({ navigation }: StreakSettingsScreenProps) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const userId = user?.id || 1;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [weekendMode, setWeekendMode] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Stats state
  const [bestStreak, setBestStreak] = useState(0);
  const [totalActiveDays, setTotalActiveDays] = useState(0);
  const [freezesLeft, setFreezesLeft] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    loadSettings();
  }, [userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [settingsResult, statsResult] = await Promise.all([
        fakeApi.getStreakData(userId),
        fakeApi.getStreakStats(userId)
      ]);

      if (settingsResult.success && settingsResult.data.settings) {
        const settings = settingsResult.data.settings;
        setDailyReminderEnabled(settings.daily_reminder_enabled || settings.dailyReminderEnabled || false);
        setWeekendMode(settings.weekend_mode || settings.weekendMode || false);
        
        // Parse reminder time
        const timeStr = settings.reminder_time || settings.reminderTime || '20:00';
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        setReminderTime(date);
      }

      if (statsResult.success && statsResult.data) {
        const stats = statsResult.data;
        setBestStreak(stats.bestStreak || 0);
        setTotalActiveDays(stats.totalActiveDays || 0);
        setFreezesLeft(stats.freezesLeft || 0);
        setCurrentStreak(stats.currentStreak || 0);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Lỗi', 'Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const timeStr = `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`;
      
      const result = await fakeApi.updateStreakSettings(userId, {
        dailyReminderEnabled,
        reminderTime: timeStr,
        weekendMode
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Thành công', 'Đã lưu cài đặt!');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Lỗi', 'Không thể lưu cài đặt');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setReminderTime(selectedDate);
    }
  };

const formatTime = (date: Date) => {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppBar title="Cài đặt Streak" onBack={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <Text>Đang tải...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppBar title="Cài đặt Streak" onBack={() => navigation.goBack()} />
      
      <ScrollView style={styles.content}>
        {/* Settings List */}
        <List.Section>
          <List.Subheader>Thông báo</List.Subheader>
          
          <List.Item
            title="Nhắc nhở hàng ngày"
            description="Nhận thông báo nhắc nhở mỗi ngày"
            left={props => <List.Icon {...props} icon="bell-outline" />}
            right={() => (
              <Switch
                value={dailyReminderEnabled}
                onValueChange={setDailyReminderEnabled}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider />
          
          <List.Item
            title="Giờ nhắc nhở"
            description={`Nhận thông báo lúc ${formatTime(reminderTime)}`}
            left={props => <List.Icon {...props} icon="clock-outline" />}
            onPress={() => setShowTimePicker(true)}
            disabled={!dailyReminderEnabled}
          />
          <Divider />
        </List.Section>

        <List.Section>
          <List.Subheader>Chế độ</List.Subheader>
          
          <List.Item
            title="Chế độ cuối tuần"
            description="Không tính streak vào thứ 7 & Chủ nhật"
            left={props => <List.Icon {...props} icon="calendar-weekend" />}
            right={() => (
              <Switch
                value={weekendMode}
                onValueChange={setWeekendMode}
                color={theme.colors.primary}
              />
            )}
          />
          <Divider />
        </List.Section>

        <List.Section>
          <List.Subheader>Thông tin</List.Subheader>
          
          <List.Item
            title="Về Streak"
            description="Streak được tính khi bạn ghi giao dịch hoặc xem dashboard mỗi ngày"
            left={props => <List.Icon {...props} icon="information-outline" />}
          />
          <Divider />
          
          <List.Item
            title="Freeze"
            description="Mỗi tuần bạn có 1 lần freeze để giữ streak khi không hoạt động"
            left={props => <List.Icon {...props} icon="snowflake" />}
          />
          <Divider />
        </List.Section>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={saveSettings}
            loading={saving}
            disabled={saving}
            icon="content-save"
          >
            Lưu cài đặt
          </Button>
        </View>
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    paddingVertical: 8,
  },
});

