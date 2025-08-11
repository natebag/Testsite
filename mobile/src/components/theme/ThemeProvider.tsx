/**
 * Gaming Theme Provider
 */

import React, {createContext, useContext, ReactNode} from 'react';
import {useAppSelector} from '@/store';

interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: {fontSize: number; fontWeight: string};
    h2: {fontSize: number; fontWeight: string};
    h3: {fontSize: number; fontWeight: string};
    body: {fontSize: number; fontWeight: string};
    caption: {fontSize: number; fontWeight: string};
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

const darkTheme: Theme = {
  colors: {
    primary: '#00ff88',
    secondary: '#ff6b35',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    text: '#ffffff',
    textSecondary: '#cccccc',
    accent: '#00d4ff',
    success: '#00ff88',
    warning: '#ffb800',
    error: '#ff4757',
    border: '#333333',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {fontSize: 28, fontWeight: 'bold'},
    h2: {fontSize: 24, fontWeight: 'bold'},
    h3: {fontSize: 20, fontWeight: '600'},
    body: {fontSize: 16, fontWeight: 'normal'},
    caption: {fontSize: 14, fontWeight: 'normal'},
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
};

const lightTheme: Theme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#e0e0e0',
  },
};

const ThemeContext = createContext<Theme>(darkTheme);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const {preferences} = useAppSelector(state => state.user);
  const isDark = preferences?.theme === 'dark' || true; // Default to dark for gaming theme

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};