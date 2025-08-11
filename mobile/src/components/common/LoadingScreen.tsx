/**
 * Loading Screen Component
 */

import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...'
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.message, {color: theme.colors.text}]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
  },
});