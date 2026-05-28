import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { getStatusColor, capitalize } from '../utils/format';

interface StatusBadgeProps {
  status: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, style, textStyle }) => {
  const baseColor = getStatusColor(status);
  
  // Custom HSL/RGBA backgrounds for premium glass/translucent feeling
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const backgroundColor = hexToRgba(baseColor, 0.1);

  return (
    <View style={[styles.badge, { backgroundColor, borderColor: hexToRgba(baseColor, 0.2) }, style]}>
      <View style={[styles.dot, { backgroundColor: baseColor }]} />
      <Text style={[styles.text, { color: baseColor }, textStyle]}>
        {capitalize(status.replace(/_/g, ' '))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
