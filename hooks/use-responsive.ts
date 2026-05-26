import { useWindowDimensions } from 'react-native'

export const useResponsive = () => {
  const { width, height } = useWindowDimensions()

  // Breakpoints
  const isSmall = width < 375
  const isMedium = width >= 375 && width < 768
  const isLarge = width >= 768 && width < 1024
  const isExtraLarge = width >= 1024

  // Layout utilities
  const getSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
    const spacing = {
      xs: isSmall ? 8 : isMedium ? 12 : 16,
      sm: isSmall ? 12 : isMedium ? 16 : 20,
      md: isSmall ? 16 : isMedium ? 20 : 24,
      lg: isSmall ? 20 : isMedium ? 24 : 32,
      xl: isSmall ? 24 : isMedium ? 32 : 40,
    }
    return spacing[size]
  }

  const getFontSize = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl') => {
    const fontSizes = {
      xs: isSmall ? 10 : isMedium ? 11 : 12,
      sm: isSmall ? 12 : isMedium ? 13 : 14,
      md: isSmall ? 14 : isMedium ? 15 : 16,
      lg: isSmall ? 16 : isMedium ? 18 : 20,
      xl: isSmall ? 18 : isMedium ? 20 : 24,
      '2xl': isSmall ? 24 : isMedium ? 28 : 32,
      '3xl': isSmall ? 28 : isMedium ? 32 : 36,
    }
    return fontSizes[size]
  }

  const getCardWidth = () => {
    if (isSmall) return '100%'
    if (isMedium) return '48%'
    return '31%'
  }

  const getGridColumns = () => {
    if (isSmall) return 1
    if (isMedium) return 2
    return 3
  }

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge,
    isExtraLarge,
    getSpacing,
    getFontSize,
    getCardWidth,
    getGridColumns,
    // Common responsive patterns
    isMobile: isSmall || isMedium,
    isTablet: isLarge,
    isDesktop: isExtraLarge,
  }
}
