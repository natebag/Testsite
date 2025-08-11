/**
 * Login Screen
 */

import React, {useState} from 'react';
import {View, Text, TextInput, StyleSheet, Alert} from 'react-native';
import {useAppDispatch} from '@/store';
import {loginWithCredentials, loginWithBiometrics} from '@/store/slices/authSlice';
import {GamingButton} from '@/components/gaming/GamingButton';
import {useTheme} from '@/components/theme/ThemeProvider';
import {BiometricService} from '@/services/BiometricService';

export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await dispatch(loginWithCredentials({email, password})).unwrap();
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      await dispatch(loginWithBiometrics()).unwrap();
    } catch (error: any) {
      Alert.alert('Biometric Login Failed', error.message);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>Sign In</Text>
      
      <TextInput
        style={[styles.input, {borderColor: theme.colors.border, color: theme.colors.text}]}
        placeholder="Email"
        placeholderTextColor={theme.colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={[styles.input, {borderColor: theme.colors.border, color: theme.colors.text}]}
        placeholder="Password"
        placeholderTextColor={theme.colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <GamingButton
        title="Sign In"
        onPress={handleLogin}
        loading={loading}
        fullWidth
        style={styles.button}
      />
      
      <GamingButton
        title="Use Biometrics"
        onPress={handleBiometricLogin}
        variant="outline"
        fullWidth
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    marginBottom: 16,
  },
});