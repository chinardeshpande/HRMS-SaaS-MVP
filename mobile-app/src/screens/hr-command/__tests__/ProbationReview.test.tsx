/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ProbationReviewScreen } from '../ProbationReviewScreen';

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

// Mock navigation and route
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: { probationId: 'p-1' },
    }),
  };
});

describe('ProbationReviewScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with probationer profile details', () => {
    render(<ProbationReviewScreen />);
    
    // Header & profile
    expect(screen.getByText('Probation Assessment')).toBeTruthy();
    expect(screen.getByText('Aarav Mehta')).toBeTruthy();
    expect(screen.getByText('Node Developer • Engineering')).toBeTruthy();
    expect(screen.getByText('Joined: 25/02/2026 • Duration: 3 Months')).toBeTruthy();
  });

  it('displays manager recommendation details', () => {
    render(<ProbationReviewScreen />);
    
    expect(screen.getByText('Evaluation by Sarah Manager')).toBeTruthy();
    expect(screen.getByText(/"Excellent engineering skillset. Aarav took ownership of 3 microservices and has integrated well with the team. Strongly recommend confirmation."/)).toBeTruthy();
  });

  it('displays assessment ratings criteria', () => {
    render(<ProbationReviewScreen />);
    
    expect(screen.getByText('Technical Capability')).toBeTruthy();
    expect(screen.getByText('Attendance & Diligence')).toBeTruthy();
    expect(screen.getByText('Team Collaboration')).toBeTruthy();
    expect(screen.getByText('Demeanor & Culture Fit')).toBeTruthy();
  });

  it('allows clicking tabs in decision center', () => {
    render(<ProbationReviewScreen />);
    
    // Tap "Extend" decision tab
    const extendBtn = screen.getByText('Extend');
    fireEvent.press(extendBtn);
    
    // Expect extension form to appear
    expect(screen.getByText('Select Extension Period')).toBeTruthy();
    expect(screen.getByText('3 Months')).toBeTruthy();
  });
});
