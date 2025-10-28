// theme/index.ts
import { MD3LightTheme as DefaultLight, MD3DarkTheme as DefaultDark, configureFonts } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

const colors = {
	primary: '#22C55E',
	primaryDark: '#16A34A',
	primaryLight: '#86EFAC',
	accent: '#10B981',
	info: '#3B82F6',
	warning: '#F59E0B',
	error: '#EF4444',
	neutral: {
		900: '#0F172A',
		700: '#334155',
		500: '#64748B',
		300: '#CBD5E1',
		100: '#F1F5F9',
	},
};

const fontConfig = {
	config: {
		fontFamily: 'System',
	},
};

const typography = {
	h1: { fontSize: 28, lineHeight: Math.round(28 * 1.35), fontWeight: '700' as const },
	h2: { fontSize: 24, lineHeight: Math.round(24 * 1.35), fontWeight: '600' as const },
	h3: { fontSize: 20, lineHeight: Math.round(20 * 1.35), fontWeight: '600' as const },
	body: { fontSize: 16, lineHeight: Math.round(16 * 1.45), fontWeight: '400' as const },
	small: { fontSize: 14, lineHeight: Math.round(14 * 1.45), fontWeight: '400' as const },
	caption: { fontSize: 12, lineHeight: Math.round(12 * 1.4), fontWeight: '400' as const },
};

const spacing = (n: number) => [0, 4, 8, 12, 16, 20, 24][n] ?? n * 8;

const radius = {
	card: 12,
	sheet: 20,
	pill: 999,
};

const elevation = {
	card: 3,
	sheet: 6,
};

export const lightTheme = {
	...DefaultLight,
	colors: {
		...DefaultLight.colors,
		primary: colors.primary,
		secondary: colors.accent,
		background: '#FFFFFF',
		surface: '#FFFFFF',
		outline: colors.neutral[300],
		error: colors.error,
		onPrimary: '#FFFFFF',
		tertiary: colors.info,
	},
	fonts: configureFonts({ config: fontConfig.config }),
	spacing,
	radius,
	elevation,
	semantic: { colors, typography },
} as const;

export const darkTheme = {
	...DefaultDark,
	colors: {
		...DefaultDark.colors,
		primary: colors.primaryLight,
		secondary: colors.accent,
		background: '#0B1220',
		surface: '#0F172A',
		outline: colors.neutral[700],
		error: colors.error,
		tertiary: colors.info,
	},
	fonts: configureFonts({ config: fontConfig.config }),
	spacing,
	radius,
	elevation,
	semantic: { colors, typography },
} as const;

export type AppTheme = typeof lightTheme;

export function useAppTheme() {
	return useTheme<AppTheme>();
}
