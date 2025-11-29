import { apiClient } from './client';

export interface DashboardStats {
  summary: {
    income: number;
    expense: number;
    incomeChange: number;
    expenseChange: number;
  };
  barChart: Array<{
    value: number;
    label: string;
    spacing: number;
    labelWidth: number;
    frontColor: string;
  }>;
  pieChart: Array<{
    value: number;
    color: string;
    category: {
      id: number;
      name: string;
      icon: string | null;
    };
    text: string;
  }>;
  topCategories: Array<{
    category: {
      id: number;
      name: string;
      icon: string | null;
    };
    amount: number;
  }>;
  recentTransactions: Array<{
    id: number;
    title: string;
    displayAmount: number;
    isIncome: boolean;
    formattedDate: string;
    category?: {
      name: string;
      icon: string | null;
    };
  }>;
  dateRange: {
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
    label: string;
  };
}

export interface DashboardStatsResponse {
  code: string;
  message: string;
  data: DashboardStats;
}

export const dashboardApi = {
  /**
   * Get dashboard stats
   * GET /dashboard/stats?timeRange=week|month
   */
  getStats(timeRange: 'week' | 'month' = 'week') {
    return apiClient.get<DashboardStatsResponse>('/dashboard/stats', {
      params: { timeRange },
    });
  },
};

