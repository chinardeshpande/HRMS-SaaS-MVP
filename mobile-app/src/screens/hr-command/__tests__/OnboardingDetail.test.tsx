/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { OnboardingDetailScreen } from '../OnboardingDetailScreen';

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
      params: { candidateId: 'c-1' },
    }),
  };
});

describe('OnboardingDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with candidate details', () => {
    render(<OnboardingDetailScreen />);
    
    // Check candidate profile details
    expect(screen.getByText('Candidate Onboarding')).toBeTruthy();
    expect(screen.getByText('Maya Iyer')).toBeTruthy();
    expect(screen.getByText('UX Designer • Design')).toBeTruthy();
    expect(screen.getByText('Email: maya.iyer@demo.aurorahr.in • Join Date: 01/06/2026')).toBeTruthy();
  });

  it('displays correct BGV checks checklist', () => {
    render(<OnboardingDetailScreen />);
    
    // Check checklist items are rendered
    expect(screen.getByText('Identity & Address Check')).toBeTruthy();
    expect(screen.getByText('Academic Record Check')).toBeTruthy();
    expect(screen.getByText('Prior Employment Check')).toBeTruthy();
    expect(screen.getByText('Criminal Registry Check')).toBeTruthy();
  });

  it('handles background verification check toggles', () => {
    render(<OnboardingDetailScreen />);
    
    const academicCheck = screen.getByText('Academic Record Check');
    fireEvent.press(academicCheck);
    
    // Check status toggles successfully
    expect(screen.getByText('75%')).toBeTruthy(); // Because Maya starts at 100%, toggling one check to pending makes it 75%
  });

  it('navigates back when left arrow button is clicked', () => {
    render(<OnboardingDetailScreen />);
    
    const backBtn = screen.getByTestId('icon-arrow-left');
    fireEvent.press(backBtn);
    
    expect(mockGoBack).toHaveBeenCalled();
  });
});
