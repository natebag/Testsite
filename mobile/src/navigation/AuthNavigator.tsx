/**
 * Authentication Navigation
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

// Screens
import {LoginScreen} from '@/screens/auth/LoginScreen';
import {RegisterScreen} from '@/screens/auth/RegisterScreen';
import {ForgotPasswordScreen} from '@/screens/auth/ForgotPasswordScreen';
import {WalletConnectScreen} from '@/screens/auth/WalletConnectScreen';
import {BiometricSetupScreen} from '@/screens/auth/BiometricSetupScreen';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  WalletConnect: undefined;
  BiometricSetup: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{
          title: 'Reset Password',
        }}
      />
      <Stack.Screen 
        name="WalletConnect" 
        component={WalletConnectScreen} 
        options={{
          title: 'Connect Wallet',
        }}
      />
      <Stack.Screen 
        name="BiometricSetup" 
        component={BiometricSetupScreen} 
        options={{
          title: 'Biometric Setup',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};