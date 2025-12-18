import { streakApi } from '../api/streakApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

export enum StreakState {
  NEW_START = 'new_start',
  MAINTAINING = 'maintaining', 
  WARNING = 'warning',
  LOST = 'lost',
  MILESTONE = 'milestone'
}

export interface StreakStatus {
  state: StreakState;
  currentStreak: number;
  bestStreak: number;
  todayCompleted: boolean;
  daysSinceLastActivity: number;
  milestone?: number;
  warningLevel?: 1 | 2;
  isNewUser?: boolean;
}

export const getStreakState = (streakData: any): StreakStatus => {
  if (!streakData) {
    return {
      state: StreakState.NEW_START,
      currentStreak: 0,
      bestStreak: 0,
      todayCompleted: false,
      daysSinceLastActivity: 0,
      isNewUser: true,
    };
  }

  const normalizeDate = (value?: string | Date | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const currentStreak = streakData.streak?.streak_days ?? streakData.streak?.streakDays ?? 0;
  const bestStreak = streakData.settings?.best_streak ?? streakData.settings?.bestStreak ?? 0;
  const totalActiveDays = streakData.settings?.total_active_days ?? streakData.settings?.totalActiveDays ?? 0;
  const todayCompleted = Boolean(streakData.todayCompleted);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActivityDate = normalizeDate(
    streakData.streak?.last_transaction_date ?? streakData.streak?.lastTransactionDate
  );

  let daysSinceLastActivity = Number.POSITIVE_INFINITY;
  if (lastActivityDate) {
    daysSinceLastActivity = Math.max(
      0,
      Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  const isNewUser =
    (!lastActivityDate || Number.isNaN(daysSinceLastActivity)) &&
    currentStreak === 0 &&
    totalActiveDays === 0;

  const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

  let state: StreakState = StreakState.NEW_START;
  let milestone: number | undefined;
  let warningLevel: 1 | 2 | undefined;

  if (isNewUser) {
    daysSinceLastActivity = 0;
  } else if (currentStreak > 0 && daysSinceLastActivity === 0) {
    state = StreakState.MAINTAINING;
    milestone = milestones.find((m) => m === currentStreak);
    if (milestone) {
      state = StreakState.MILESTONE;
    }
  } else if (daysSinceLastActivity === 1) {
    state = StreakState.WARNING;
    warningLevel = 1;
  } else if (daysSinceLastActivity === 2) {
    state = StreakState.WARNING;
    warningLevel = 2;
  } else if (daysSinceLastActivity > 2) {
    state = StreakState.LOST;
  }

  return {
    state,
    currentStreak,
    bestStreak,
    todayCompleted,
    daysSinceLastActivity: Number.isFinite(daysSinceLastActivity) ? daysSinceLastActivity : 0,
    milestone,
    warningLevel,
    isNewUser,
  };
};

export const getStreakMessage = (
  status: StreakStatus
): { title: string; subtitle: string; icon: string; color: string } => {
  switch (status.state) {
    case StreakState.NEW_START:
      return {
        title: 'Bắt đầu hành trình!',
        subtitle: status.isNewUser
          ? 'Hãy ghi giao dịch đầu tiên để khởi động streak của bạn.'
          : 'Bạn vừa khởi động lại streak, tiếp tục duy trì nhé.',
        icon: 'fire',
        color: '#FF6B35',
      };

    case StreakState.MAINTAINING:
      return {
        title: `Streak hiện tại: ${status.currentStreak} ngày`,
        subtitle: 'Tuyệt vời! Tiếp tục ghi lại chi tiêu hoặc kiểm tra ngân sách nhé.',
        icon: 'fire',
        color: '#FF6B35',
      };

    case StreakState.WARNING:
      return status.warningLevel === 2
        ? {
            title: 'Sắp mất streak!',
            subtitle: 'Bạn đã nghỉ 2 ngày. Ghi giao dịch ngay để giữ streak.',
            icon: 'alarm-light',
            color: '#EA580C',
          }
        : {
            title: 'Cẩn thận!',
            subtitle: 'Bạn đã nghỉ 1 ngày. Đừng quên ghi lại chi tiêu để duy trì streak.',
            icon: 'alert-outline',
            color: '#F59E0B',
          };

    case StreakState.LOST:
      return {
        title: 'Chuỗi streak đã kết thúc',
        subtitle: status.bestStreak
          ? `Chuỗi trước đạt ${status.bestStreak} ngày. Sẵn sàng bắt đầu lại nào?`
          : 'Hãy bắt đầu lại từ hôm nay!',
        icon: 'fire-off',
        color: '#EF4444',
      };

    case StreakState.MILESTONE:
      return {
        title: `Chúc mừng! ${status.currentStreak} ngày liên tục!`,
        subtitle: 'Thói quen tài chính của bạn thật đáng nể.',
        icon: 'trophy',
        color: '#FFD700',
      };

    default:
      return {
        title: 'Streak',
        subtitle: '',
        icon: 'fire',
        color: '#FF6B35',
      };
  }
};

export const triggerStreakActivity = async (
  activityType: string,
  date?: string
): Promise<void> => {
  try {
    await streakApi.activate({
      activity_type: activityType,
      date,
    });
  } catch (error) {
    console.warn('Failed to activate streak activity', error);
  }
};
