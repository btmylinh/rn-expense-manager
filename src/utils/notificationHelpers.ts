import { NotificationType } from '../contexts/NotificationContext';

export const createBudgetWarningNotification = (budgetName: string, percentage: number, remaining: number) => ({
  userId: 1,
  type: NotificationType.BUDGET_WARNING,
  title: '⚡ Sắp hết ngân sách',
  message: `Bạn đã sử dụng ${percentage}% ngân sách ${budgetName}. Còn lại ${remaining.toLocaleString('vi-VN')}₫`,
  data: { budgetName, percentage, remaining },
  isRead: false,
});

export const createLargeTransactionNotification = (amount: number, category: string) => ({
  userId: 1,
  type: NotificationType.LARGE_TRANSACTION,
  title: '💸 Giao dịch lớn',
  message: `Bạn vừa chi ${amount.toLocaleString('vi-VN')}₫ cho ${category}. Đây là giao dịch lớn nhất tuần này.`,
  data: { amount, category },
  isRead: false,
});

export const createWeeklyReportNotification = (saved: number) => ({
  userId: 1,
  type: NotificationType.WEEKLY_REPORT,
  title: ' Báo cáo tuần',
  message: `Tuần này bạn đã tiết kiệm được ${saved.toLocaleString('vi-VN')}₫ so với tuần trước. Tuyệt vời! `,
  data: { saved },
  isRead: false,
});

export const createGoalAchievedNotification = (goalName: string, savedAmount: number) => ({
  userId: 1,
  type: NotificationType.GOAL_ACHIEVED,
  title: '🎯 Chúc mừng!',
  message: `Bạn đã hoàn thành mục tiêu tiết kiệm ${goalName}! Số tiền đã tiết kiệm: ${savedAmount.toLocaleString('vi-VN')}₫`,
  data: { goalName, savedAmount },
  isRead: false,
});
