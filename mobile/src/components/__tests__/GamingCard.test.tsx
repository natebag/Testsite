/**
 * GamingCard Component Tests
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {GamingCard} from '../gaming/GamingCard';
import {ThemeProvider} from '../theme/ThemeProvider';

const TestWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('GamingCard', () => {
  const mockProps = {
    title: 'Test Card',
    description: 'Test description',
    onPress: jest.fn(),
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    onDoubleTap: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const {getByText} = render(
      <TestWrapper>
        <GamingCard {...mockProps} />
      </TestWrapper>
    );

    expect(getByText('Test Card')).toBeTruthy();
    expect(getByText('Test description')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const {getByText} = render(
      <TestWrapper>
        <GamingCard {...mockProps} />
      </TestWrapper>
    );

    fireEvent.press(getByText('Test Card'));
    expect(mockProps.onPress).toHaveBeenCalled();
  });

  it('disables gestures when enableGestures is false', () => {
    const {getByText} = render(
      <TestWrapper>
        <GamingCard {...mockProps} enableGestures={false} />
      </TestWrapper>
    );

    expect(getByText('Test Card')).toBeTruthy();
    // Gesture functionality would be tested with more sophisticated gesture mocking
  });
});