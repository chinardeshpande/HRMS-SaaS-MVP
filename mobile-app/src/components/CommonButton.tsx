import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface CommonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const CommonButton: React.FC<CommonButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: '#f3f4f6', borderWidth: 0 },
          text: { color: '#374151' },
        };
      case 'danger':
        return {
          container: { backgroundColor: '#ef4444', borderWidth: 0 },
          text: { color: '#ffffff' },
        };
      case 'success':
        return {
          container: { backgroundColor: '#22c55e', borderWidth: 0 },
          text: { color: '#ffffff' },
        };
      case 'outline':
        return {
          container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#0A66C2' },
          text: { color: '#0A66C2' },
        };
      case 'primary':
      default:
        return {
          container: { backgroundColor: '#0A66C2', borderWidth: 0 },
          text: { color: '#ffffff' },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        disabled={disabled || loading}
        style={[
          styles.container,
          variantStyles.container,
          (disabled || loading) && styles.disabledContainer,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'secondary' ? '#0A66C2' : '#ffffff'}
          />
        ) : (
          <Animated.View style={styles.contentContainer}>
            {icon && <Animated.View style={styles.iconContainer}>{icon}</Animated.View>}
            <Text style={[styles.text, variantStyles.text, textStyle]}>{title}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    shadowColor: '#0A66C2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
