import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { parseISO, differenceInSeconds } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { themeColors, themeStyles } from '../utils/theme';

interface AnimatedTimerProps {
  startTime?: string; // ISO string when active session started
  isActive: boolean;
}

export const AnimatedTimer: React.FC<AnimatedTimerProps> = ({ startTime, isActive }) => {
  const [elapsed, setElapsed] = useState('00:00:00');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation loop when active
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;
    let glowAnimation: Animated.CompositeAnimation | null = null;

    if (isActive) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      glowAnimation.start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }

    return () => {
      if (pulseAnimation) pulseAnimation.stop();
      if (glowAnimation) glowAnimation.stop();
    };
  }, [isActive]);

  // Tick timer every second based on startTime
  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed('00:00:00');
      return;
    }

    const start = parseISO(startTime);

    const updateTimer = () => {
      const now = new Date();
      const diffSecs = differenceInSeconds(now, start);

      if (diffSecs < 0) {
        setElapsed('00:00:00');
        return;
      }

      const hrs = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;

      const pad = (n: number) => String(n).padStart(2, '0');
      setElapsed(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
    };

    updateTimer(); // run once immediately
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  // Dynamic glowing shadow styling for active state
  const shadowGlow = isActive
    ? {
        shadowColor: themeColors.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 0.75],
        }),
        shadowRadius: glowAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 22],
        }),
      }
    : {};

  return (
    <View style={styles.container}>
      {/* Dynamic Pulsing Outer Rings */}
      {isActive && (
        <>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.4, 0],
                }),
                borderColor: themeColors.success,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRingOuter,
              {
                transform: [{ scale: pulseAnim.interpolate({ inputRange: [1, 1.2], outputRange: [1, 1.35] }) }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.2, 0],
                }),
                borderColor: themeColors.success,
              },
            ]}
          />
        </>
      )}

      {/* Main Interactive Dial */}
      <Animated.View
        style={[
          styles.timerCircle,
          isActive ? styles.activeCircle : styles.inactiveCircle,
          shadowGlow,
        ]}
      >
        {/* Glowing Background Biometric Icon */}
        <Animated.View
          style={[
            styles.biometricBackdrop,
            {
              opacity: isActive
                ? glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.18] })
                : 0.05,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="fingerprint"
            size={110}
            color={isActive ? themeColors.success : themeColors.textMuted}
          />
        </Animated.View>

        <Text style={[themeStyles.typography.caption, styles.label, isActive && styles.activeText]}>
          {isActive ? 'ACTIVE SHIFT' : 'CLOCKED OUT'}
        </Text>
        <Text style={[styles.timeText, isActive && styles.activeTime]}>{elapsed}</Text>
        <Text style={[themeStyles.typography.bodyMedium, styles.sublabel]}>
          {isActive ? 'Hours elapsed today' : 'No active session'}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: 220,
    height: 220,
  },
  pulseRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  pulseRingOuter: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.02)',
  },
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    backgroundColor: '#ffffff',
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },
  activeCircle: {
    borderColor: themeColors.success,
  },
  inactiveCircle: {
    borderColor: '#E5E7EB',
  },
  biometricBackdrop: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    letterSpacing: 1.8,
    marginBottom: 4,
    color: themeColors.textSecondary,
  },
  activeText: {
    color: themeColors.success,
  },
  timeText: {
    fontSize: 32,
    fontWeight: '800',
    color: themeColors.textPrimary,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  activeTime: {
    color: themeColors.success,
  },
  sublabel: {
    color: themeColors.textMuted,
    marginTop: 4,
  },
});
