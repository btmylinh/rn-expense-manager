import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Hardcode IP máy tính nếu cần, để trống để tự động phát hiện
const MANUAL_IP = '';
const DEFAULT_COMPUTER_IP = '172.16.0.195';
// const DEFAULT_COMPUTER_IP = '192.168.100.243';

/**
 * Kiểm tra xem đang chạy trên emulator/simulator hay thiết bị thật
 * @returns true nếu là emulator/simulator, false nếu là physical device
 */
const isEmulator = (): boolean => {
  try {
    return !Device.isDevice; // false nghĩa là emulator/simulator
  } catch {
    // Fallback kiểm tra tên/model thiết bị
    try {
      const deviceName = Device.deviceName || '';
      const modelName = Device.modelName || '';
      const brand = Device.brand || '';
      const emulatorKeywords = ['emulator', 'sdk', 'generic', 'simulator', 'sim'];
      const checkString = `${deviceName} ${modelName} ${brand}`.toLowerCase();
      return emulatorKeywords.some(keyword => checkString.includes(keyword));
    } catch {
      return Platform.OS === 'android'; // mặc định Android là emulator
    }
  }
};

const normalizeHost = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/(^\w+:|^)\/\//, ''); // bỏ protocol nếu có
};

const getExpoExtraHost = (): string | null => {
  const extra = Constants.expoConfig?.extra as { apiHost?: string } | undefined;
  return normalizeHost(extra?.apiHost);
};

const getDebuggerHostIp = (): string | null => {
  const debuggerHost =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    '';

  const hostCandidate = debuggerHost.split(':')[0];
  if (!hostCandidate || ['localhost', '127.0.0.1'].includes(hostCandidate)) return null;

  return hostCandidate;
};

const getAutoDetectedHost = (): string | null => {
  return getExpoExtraHost() || getDebuggerHostIp();
};

const getApiHost = (): string => {
  const dynamicHost = getAutoDetectedHost();
  if (MANUAL_IP) return MANUAL_IP; // ưu tiên IP hardcode
  if (dynamicHost) return dynamicHost;

  if (__DEV__) {
    const isEmu = isEmulator();
    if (Platform.OS === 'android') return isEmu ? '10.0.2.2' : DEFAULT_COMPUTER_IP;
    if (Platform.OS === 'ios') return isEmu ? 'localhost' : DEFAULT_COMPUTER_IP;
  }

  return DEFAULT_COMPUTER_IP || 'localhost'; // Production: domain hoặc IP public
};

const API_HOST = getApiHost();
export const API_BASE_URL = `http://${API_HOST}:5000/api`;

// Log debug khi dev
if (__DEV__) {
  const deviceType = isEmulator() ? 'Emulator/Simulator' : 'Thiết bị thật';
  console.log(`[Config] API_BASE_URL: ${API_BASE_URL}`);
  console.log(`[Config] Platform: ${Platform.OS}`);
  console.log(`[Config] Device Type: ${deviceType}`);
  console.log(`[Config] Device Name: ${Device.deviceName || 'Unknown'}`);
  console.log(`[Config] Model: ${Device.modelName || 'Unknown'}`);
}

// Key lưu trữ trong AsyncStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token', // token xác thực request
  REFRESH_TOKEN: 'refresh_token', // token làm mới access token
  USER: 'user', // thông tin người dùng đăng nhập
} as const;
