import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { streakApi } from '../api/streakApi';

interface StreakCacheData {
  streak: {
    streakDays: number;
    lastTransactionDate: string | null;
  };
  settings: {
    bestStreak: number;
    totalActiveDays: number;
  };
  todayCompleted: boolean;
  recentHistory: Array<{ date: string; has_activity: number }>;
  lastSync: number; // timestamp
}

const CACHE_KEY_PREFIX = 'streak_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút
const RECENT_HISTORY_CACHE_DURATION = 10 * 60 * 1000; // 10 phút cho history

export const useStreakCache = (userId: number | undefined) => {
  const [cacheData, setCacheData] = useState<StreakCacheData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCacheKey = useCallback(() => {
    return `${CACHE_KEY_PREFIX}${userId}`;
  }, [userId]);

  // Load từ cache
  const loadFromCache = useCallback(async () => {
    if (!userId) return null;

    try {
      const cacheKey = getCacheKey();
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const data: StreakCacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Kiểm tra cache còn hiệu lực không
        if (now - data.lastSync < CACHE_DURATION) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to load streak cache:', error);
    }
    return null;
  }, [userId, getCacheKey]);

  // Lưu vào cache
  const saveToCache = useCallback(async (data: Partial<StreakCacheData>) => {
    if (!userId) return;

    try {
      const cacheKey = getCacheKey();
      const existing = await loadFromCache();
      const newData: StreakCacheData = {
        ...existing,
        ...data,
        lastSync: Date.now(),
      } as StreakCacheData;
      
      await AsyncStorage.setItem(cacheKey, JSON.stringify(newData));
      setCacheData(newData);
    } catch (error) {
      console.warn('Failed to save streak cache:', error);
    }
  }, [userId, getCacheKey, loadFromCache]);

  // Sync từ API (chỉ khi cần)
  const syncFromAPI = useCallback(async (force = false) => {
    if (!userId) return;

    const cached = await loadFromCache();
    if (!force && cached) {
      const now = Date.now();
      if (now - cached.lastSync < CACHE_DURATION) {
        setCacheData(cached);
        setIsLoading(false);
        return cached;
      }
    }

    try {
      setIsLoading(true);
      
      // Gọi API song song
      const [streakResponse, settingsResponse, historyResponse] = await Promise.all([
        streakApi.getStreak(),
        streakApi.getSettings(),
        streakApi.getHistory({ limit: 7 }), // Chỉ lấy 7 ngày gần nhất
      ]);

      const streakData = streakResponse.data?.data;
      const settings = settingsResponse.data?.data;
      const history = historyResponse.data?.data?.history || [];

      const today = new Date().toISOString().split('T')[0];
      const todayHistory = history.find((h: any) => {
        const historyDate = new Date(h.date).toISOString().split('T')[0];
        return historyDate === today;
      });

      // Tính 7 ngày gần nhất
      const recent7Days: Array<{ date: string; has_activity: number }> = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const historyEntry = history.find((h: any) => {
          const historyDate = new Date(h.date).toISOString().split('T')[0];
          return historyDate === dateStr;
        });
        recent7Days.push({
          date: dateStr,
          has_activity: historyEntry?.has_activity || 0,
        });
      }

      const newCacheData: StreakCacheData = {
        streak: {
          streakDays: streakData?.streak_days || 0,
          lastTransactionDate: streakData?.last_transaction_date || null,
        },
        settings: {
          bestStreak: settings?.best_streak || 0,
          totalActiveDays: settings?.total_active_days || 0,
        },
        todayCompleted: todayHistory?.has_activity === 1 || false,
        recentHistory: recent7Days,
        lastSync: Date.now(),
      };

      await saveToCache(newCacheData);
      setIsLoading(false);
      return newCacheData;
    } catch (error) {
      console.error('Failed to sync streak from API:', error);
      setIsLoading(false);
      // Trả về cache cũ nếu có
      if (cached) {
        setCacheData(cached);
        return cached;
      }
      return null;
    }
  }, [userId, loadFromCache, saveToCache]);

  // Invalidate cache (khi có transaction mới)
  const invalidateCache = useCallback(async () => {
    if (!userId) return;
    try {
      const cacheKey = getCacheKey();
      await AsyncStorage.removeItem(cacheKey);
      setCacheData(null);
    } catch (error) {
      console.warn('Failed to invalidate streak cache:', error);
    }
  }, [userId, getCacheKey]);

  // Load initial data
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      const cached = await loadFromCache();
      if (cached) {
        setCacheData(cached);
        setIsLoading(false);
        // Sync ngầm trong background
        syncFromAPI(false).catch(console.error);
      } else {
        // Không có cache, sync ngay
        await syncFromAPI(true);
      }
    };

    init();
  }, [userId, loadFromCache, syncFromAPI]);

  return {
    cacheData,
    isLoading,
    syncFromAPI,
    invalidateCache,
    refresh: () => syncFromAPI(true),
  };
};

