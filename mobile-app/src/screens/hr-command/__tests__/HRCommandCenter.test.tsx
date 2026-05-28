/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { HRCommandCenterScreen } from '../HRCommandCenterScreen';

// Mock expo vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => {
      return React.createElement(Text, { testID: `icon-${props.name}` }, props.name);
    },
  };
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: (props: any) => React.createElement(View, props),
  };
});

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    MD3LightTheme: {},
    Provider: (props: any) => props.children,
    Card: (props: any) => React.createElement(View, props),
    Text: (props: any) => React.createElement(Text, props),
  };
});

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: jest.fn(),
    }),
  };
});

describe('HRCommandCenterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and defaults to Onboarding tab', () => {
    render(<HRCommandCenterScreen />);
    
    // Check header
    expect(screen.getByText('HR Command Hub')).toBeTruthy();
    
    // Check tabs are visible
    expect(screen.getByText('Onboarding')).toBeTruthy();
    expect(screen.getByText('Performance')).toBeTruthy();
    expect(screen.getByText('Exits Hub')).toBeTruthy();

    // Check onboarding candidate lists rendered
    expect(screen.getByText('Maya Iyer')).toBeTruthy();
    expect(screen.getByText('Rajesh Kumar')).toBeTruthy();
  });

  it('allows switching to Performance tab', () => {
    render(<HRCommandCenterScreen />);
    
    const performanceTab = screen.getByText('Performance');
    fireEvent.press(performanceTab);

    // Check performance elements
    expect(screen.getByText('Active Appraisal Cycle: 2026')).toBeTruthy();
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('Neha Shah')).toBeTruthy();
  });

  it('allows switching to Exits Hub tab', () => {
    render(<HRCommandCenterScreen />);
    
    const exitsTab = screen.getByText('Exits Hub');
    fireEvent.press(exitsTab);

    // Check exit stats
    expect(screen.getByText('Total Exits')).toBeTruthy();
    expect(screen.getByText('Clearance In Progress')).toBeTruthy();
    expect(screen.getByText('Pooja Raman')).toBeTruthy();
  });
});
