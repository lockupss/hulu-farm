/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Updated for higher contrast and vibrancy
const tintColorLight = '#0D9488'; // teal-600
const tintColorDark = '#06B6D4'; // cyan-500

export const Colors = {
  light: {
    text: '#111827', // gray-900
    textMuted: '#6B7280', // gray-500
    background: '#F9FAFB', // gray-50
    surface: '#FFFFFF',
    surfaceMuted: '#F3F4F6', // gray-100
    card: '#FFFFFF',
    border: '#D1D5DB', // gray-300
    shadow: 'rgba(17, 24, 39, 0.10)',
    tint: tintColorLight,
    tintSoft: '#CCFBF1', // teal-100
    icon: '#0D9488', // teal-600
    danger: '#DC2626', // red-600
    warning: '#F59E42', // orange-400
    success: '#059669', // green-600
    info: '#2563EB', // blue-600
    primary: '#0D9488', // teal-600
    secondary: '#6366F1', // indigo-500
    accent: '#A21CAF', // purple-800
    tabBar: '#FFFFFF',
    tabIconDefault: '#6B7280', // gray-500
    tabIconSelected: tintColorLight,
    gradient: {
      primary: ['#0D9488', '#06B6D4'],
      secondary: ['#6366F1', '#A21CAF'],
      success: ['#059669', '#10B981'],
      warning: ['#F59E42', '#FBBF24'],
      danger: ['#DC2626', '#F87171'],
    },
  },
  dark: {
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceMuted: '#334155',
    card: '#1E293B',
    border: '#334155',
    shadow: 'rgba(0, 0, 0, 0.4)',
    tint: tintColorDark,
    tintSoft: '#134E4A',
    icon: '#94A3B8',
    danger: '#F87171',
    warning: '#FBBf24',
    success: '#34D399',
    info: '#60A5FA',
    primary: '#5EEAD4',
    secondary: '#A78BFA',
    accent: '#C084FC',
    tabBar: '#0F172A',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    gradient: {
      primary: ['#5EEAD4', '#2DD4BF'],
      secondary: ['#A78BFA', '#C084FC'],
      success: ['#34D399', '#10B981'],
      warning: ['#FBBf24', '#F59E0B'],
      danger: ['#F87171', '#EF4444'],
    },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};
