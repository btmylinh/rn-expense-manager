// Utility functions for streak notifications
import { StreakState } from './streakHelpers';

export interface StreakNotificationData {
  userId: number;
  type: 'streak_warning' | 'streak_lost' | 'streak_milestone' | 'streak_reminder' | 'streak_freeze_reset';
  title: string;
  message: string;
  data?: any;
}

/**
 * Generate notification for streak warning
 */
export const generateWarningNotification = (
  userId: number,
  currentStreak: number
): StreakNotificationData => {
  return {
    userId,
    type: 'streak_warning',
    title: 'Cảnh báo Streak!',
    message: `Chuỗi ${currentStreak} ngày của bạn sắp bị mất! Hãy ghi giao dịch hoặc check-in hôm nay.`,
    data: { currentStreak, action: 'open_streak' }
  };
};

/**
 * Generate notification for streak lost
 */
export const generateLostNotification = (
  userId: number,
  lostStreak: number
): StreakNotificationData => {
  return {
    userId,
    type: 'streak_lost',
    title: 'Streak đã kết thúc',
    message: `Chuỗi ${lostStreak} ngày của bạn đã kết thúc. Đừng lo, bạn có thể bắt đầu lại ngay hôm nay!`,
    data: { lostStreak, action: 'open_streak' }
  };
};

/**
 * Generate notification for milestone achieved
 */
export const generateMilestoneNotification = (
  userId: number,
  milestone: number
): StreakNotificationData => {
  const badges: Record<number, string> = {
    7: 'Người mới chăm chỉ',
    14: 'Người kiên trì',
    30: 'Chuyên gia quản lý',
    60: 'Bậc thầy tài chính',
    100: 'Huyền thoại Streak',
    365: 'Siêu sao năm mới'
  };

  const badge = badges[milestone] || 'Thành tựu đặc biệt';

  return {
    userId,
    type: 'streak_milestone',
    title: `Chúc mừng! ${milestone} ngày liên tục!`,
    message: `Bạn đã đạt mốc ${milestone} ngày! Huy hiệu "${badge}" đã được mở khóa.`,
    data: { milestone, badge, action: 'open_streak' }
  };
};

/**
 * Generate daily reminder notification
 */
export const generateDailyReminder = (
  userId: number,
  currentStreak: number
): StreakNotificationData => {
  const messages = [
    `Chào buổi tối! Đã ghi lại chi tiêu hôm nay chưa? Streak hiện tại: ${currentStreak} ngày`,
    `Nhắc nhở: Hãy ghi nhận hoạt động để giữ streak ${currentStreak} ngày của bạn!`,
    `Đừng quên ghi chi tiêu hôm nay để duy trì chuỗi ${currentStreak} ngày nhé!`,
    `Streak ${currentStreak} ngày đang chờ bạn! Hãy check-in ngay.`
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return {
    userId,
    type: 'streak_reminder',
    title: 'Nhắc nhở Streak',
    message: randomMessage,
    data: { currentStreak, action: 'open_streak' }
  };
};

/**
 * Generate freeze reset notification (Monday)
 */
export const generateFreezeResetNotification = (
  userId: number
): StreakNotificationData => {
  return {
    userId,
    type: 'streak_freeze_reset',
    title: 'Freeze đã được reset!',
    message: 'Tuần mới bắt đầu! Bạn có thêm 1 freeze để sử dụng trong tuần này.',
    data: { action: 'open_streak_settings' }
  };
};

/**
 * Check if should send daily reminder based on settings
 */
export const shouldSendDailyReminder = (
  reminderEnabled: boolean,
  reminderTime: string, // Format: "HH:MM"
  todayCompleted: boolean
): boolean => {
  if (!reminderEnabled || todayCompleted) {
    return false;
  }

  const now = new Date();
  const [hours, minutes] = reminderTime.split(':').map(Number);
  
  const reminderDate = new Date();
  reminderDate.setHours(hours, minutes, 0, 0);

  // Check if current time is within 1 hour of reminder time
  const timeDiff = Math.abs(now.getTime() - reminderDate.getTime());
  const oneHour = 60 * 60 * 1000;

  return timeDiff < oneHour;
};

/**
 * Determine notification priority
 */
export const getNotificationPriority = (
  type: StreakNotificationData['type']
): 'high' | 'default' | 'low' => {
  switch (type) {
    case 'streak_warning':
      return 'high';
    case 'streak_milestone':
      return 'high';
    case 'streak_lost':
      return 'default';
    case 'streak_reminder':
      return 'default';
    case 'streak_freeze_reset':
      return 'low';
    default:
      return 'default';
  }
};

