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
}

export const getStreakState = (streakData: any): StreakStatus => {
  if (!streakData) {
    return {
      state: StreakState.NEW_START,
      currentStreak: 0,
      bestStreak: 0,
      todayCompleted: false,
      daysSinceLastActivity: 0
    };
  }

  // Support both camelCase and snake_case
  const currentStreak = streakData.streak?.streak_days || streakData.streak?.streakDays || 0;
  const bestStreak = streakData.settings?.best_streak || streakData.settings?.bestStreak || 0;
  const todayCompleted = streakData.todayCompleted || false;
  
  // Calculate days since last activity
  const lastActivityDate = streakData.streak?.last_transaction_date || streakData.streak?.lastTransactionDate;
  const daysSinceLastActivity = lastActivityDate 
    ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Check for milestones
  const milestones = [7, 14, 30, 60, 100, 365];
  const recentMilestone = milestones.find(m => currentStreak === m);

  // Determine state
  let state: StreakState;
  
  if (recentMilestone) {
    state = StreakState.MILESTONE;
  } else if (currentStreak === 0 || (currentStreak === 1 && bestStreak === 0)) {
    state = StreakState.NEW_START;
  } else if (daysSinceLastActivity >= 2) {
    state = StreakState.LOST;
  } else if (daysSinceLastActivity === 1 && !todayCompleted) {
    state = StreakState.WARNING;
  } else {
    state = StreakState.MAINTAINING;
  }

  return {
    state,
    currentStreak,
    bestStreak,
    todayCompleted,
    daysSinceLastActivity,
    milestone: recentMilestone
  };
};

export const getStreakMessage = (status: StreakStatus): { title: string; subtitle: string; icon: string; color: string } => {
  switch (status.state) {
    case StreakState.NEW_START:
      return {
        title: 'Bắt đầu hành trình!',
        subtitle: 'Bạn vừa bắt đầu hành trình chi tiêu thông minh! Ngày đầu tiên đã được ghi nhận.',
        icon: 'fire',
        color: '#FF6B35'
      };

    case StreakState.MAINTAINING:
      return {
        title: `Streak hiện tại: ${status.currentStreak} ngày`,
        subtitle: 'Tuyệt vời! Tiếp tục ghi lại chi tiêu hoặc kiểm tra ngân sách nhé.',
        icon: 'fire',
        color: '#FF6B35'
      };

    case StreakState.WARNING:
      return {
        title: 'Cẩn thận!',
        subtitle: 'Nếu bạn không ghi nhận hoạt động hôm nay, chuỗi streak sẽ bị reset.',
        icon: 'alert-outline',
        color: '#F59E0B'
      };

    case StreakState.LOST:
      return {
        title: 'Chuỗi streak đã kết thúc',
        subtitle: `Đã kết thúc sau ${status.bestStreak} ngày. Sẵn sàng bắt đầu lại nào?`,
        icon: 'fire-off',
        color: '#EF4444'
      };

    case StreakState.MILESTONE:
      return {
        title: `Chúc mừng! ${status.currentStreak} ngày liên tục!`,
        subtitle: 'Thói quen tài chính của bạn thật đáng nể.',
        icon: 'trophy',
        color: '#FFD700'
      };

    default:
      return {
        title: 'Streak',
        subtitle: '',
        icon: 'fire',
        color: '#FF6B35'
      };
  }
};
