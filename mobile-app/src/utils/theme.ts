import { MD3LightTheme } from 'react-native-paper';

/**
 * AuroraHR Consolidated Design System & Theme Tokens
 * Employs premium SaaS branding, frosted-glass specifications, 
 * standard shadow scales, and typography hierarchies.
 */
export const themeColors = {
  // Brand Anchors
  primary: '#0A66C2',       // Classic Brand Blue (Aurora Navy)
  secondary: '#47A7C7',     // Aurora Sky Blue
  
  // Status Colors (SaaS Standard)
  success: '#10B981',       // Mint Green
  warning: '#F59E0B',       // Sunset Amber
  error: '#EF4444',         // Coral Red
  info: '#3B82F6',          // Electric Blue
  
  // UI Neutrals
  background: '#F9FAFB',    // Sleek Slate Off-white
  surface: '#FFFFFF',       // Pure White
  surfaceCard: '#FFFFFF',
  
  // Grayscale Text & Accents
  textPrimary: '#111827',   // Dark Gray-900 (High contrast)
  textSecondary: '#4B5563', // Slate Gray-600
  textMuted: '#9CA3AF',     // Light Gray-400
  border: '#E5E7EB',        // Border Gray-200
  borderLight: '#F3F4F6',   // Border Gray-100
  
  // Transparencies (Glassmorphism foundations)
  glassBg: 'rgba(255, 255, 255, 0.78)',
  glassBgDark: 'rgba(15, 23, 42, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.35)',
  glassBorderDark: 'rgba(255, 255, 255, 0.1)',
  
  // Highlight backgrounds (Slightly tinted overlays)
  tintPrimary: '#F0F7FC',
  tintSuccess: '#ECFDF5',
  tintWarning: '#FEF3C7',
  tintError: '#FEF2F2',

  // Gradient presets (time-based & premium elements)
  gradients: {
    morning: ['#FFA07A', '#FF6347'],       // Sunrise peach-pink (warm aura)
    afternoon: ['#47A7C7', '#0A66C2'],     // Sleek sky-blue to deep brand blue
    night: ['#1E1B4B', '#312E81'],         // Deep indigo cosmic night
    glass: ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.55)'],
    glassDark: ['rgba(30, 41, 59, 0.9)', 'rgba(15, 23, 42, 0.85)'],
  },
};

export const themeStyles = {
  // Border Radius Guidelines
  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    round: 9999,
  },
  
  // Visual Elevation / Drop Shadows
  shadows: {
    none: {
      shadowColor: 'transparent',
      elevation: 0,
    },
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.02,
      shadowRadius: 4,
      elevation: 1,
    },
    standard: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    premium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 18,
      elevation: 5,
    },
  },
  
  // Premium Glassmorphism styling helpers
  glassmorphicPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1.5,
    shadowColor: '#0A66C2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  glassmorphicDarkPanel: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  
  // Typography Preset Scales
  typography: {
    titleLarge: {
      fontSize: 22,
      fontWeight: '800' as const,
      color: themeColors.textPrimary,
      letterSpacing: -0.5,
    },
    titleMedium: {
      fontSize: 16,
      fontWeight: '800' as const,
      color: themeColors.textPrimary,
      letterSpacing: -0.2,
    },
    bodyLarge: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: themeColors.textSecondary,
    },
    bodyMedium: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    caption: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: themeColors.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
  },
};

// React Native Paper theme integration mapping
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    background: themeColors.background,
    surface: themeColors.surface,
    error: themeColors.error,
  },
};
