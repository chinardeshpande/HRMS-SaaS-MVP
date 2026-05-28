import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { themeStyles, themeColors } from '../utils/theme';

interface CommonCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
  headerRight?: React.ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'glass';
  gradientColors?: string[];
}

export const CommonCard: React.FC<CommonCardProps> = ({
  children,
  onPress,
  style,
  headerRight,
  title,
  subtitle,
  variant = 'default',
  gradientColors,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const CardWrapper: any = onPress ? TouchableOpacity : View;

  // Assemble dynamic container styles
  const isGlass = variant === 'glass';
  const hasGradient = gradientColors && gradientColors.length >= 2;
  const containerStyle = [
    styles.container,
    isGlass && themeStyles.glassmorphicPanel,
    hasGradient && { backgroundColor: 'transparent', borderWidth: 0, shadowColor: gradientColors[1] || '#000000' },
    style,
  ];

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, containerStyle]}>
      {hasGradient && (
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <CardWrapper
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.innerContainer}
      >
        {(title || subtitle || headerRight) && (
          <View style={[styles.header, isGlass && styles.glassHeader, gradientColors && styles.gradientHeader]}>
            <View style={styles.headerTitleContainer}>
              {title && (
                <Text style={[styles.title, gradientColors && styles.gradientTitle, isGlass && styles.glassTitle]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    gradientColors && styles.gradientSubtitle,
                    isGlass && styles.glassSubtitle,
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>
            {headerRight && <View>{headerRight}</View>}
          </View>
        )}
        <View style={styles.body}>{children}</View>
      </CardWrapper>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.7)',
    shadowColor: '#1f2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: 6,
    overflow: 'hidden',
  },
  innerContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 10,
    marginBottom: 12,
  },
  glassHeader: {
    borderBottomColor: 'rgba(255, 255, 255, 0.25)',
  },
  gradientHeader: {
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.textPrimary,
    fontFamily: 'System',
    letterSpacing: -0.2,
  },
  glassTitle: {
    color: '#0F172A',
  },
  gradientTitle: {
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 12,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  glassSubtitle: {
    color: 'rgba(15, 23, 42, 0.65)',
  },
  gradientSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  body: {
    flexShrink: 1,
  },
});
