/**
 * Main App Navigation
 */

import React, {useEffect} from 'react';
import {NavigationContainer, NavigationState} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAppSelector} from '@/store';
import {RootStackParamList} from '@/types';

// Navigators
import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';

// Screens
import {WelcomeScreen} from '@/screens/WelcomeScreen';
import {ClanDetailsScreen} from '@/screens/ClanDetailsScreen';
import {ContentDetailsScreen} from '@/screens/ContentDetailsScreen';
import {ProfileScreen} from '@/screens/ProfileScreen';
import {WalletScreen} from '@/screens/WalletScreen';
import {VotingScreen} from '@/screens/VotingScreen';
import {ProposalDetailsScreen} from '@/screens/ProposalDetailsScreen';
import {SettingsScreen} from '@/screens/SettingsScreen';
import {CameraScreen} from '@/screens/CameraScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const {isAuthenticated} = useAppSelector(state => state.auth);

  const onStateChange = (state: NavigationState | undefined) => {
    // Track navigation for analytics if needed
    if (state) {
      const currentRoute = state.routes[state.index];
      console.log('Navigation changed to:', currentRoute.name);
    }
  };

  return (
    <NavigationContainer onStateChange={onStateChange}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          // Auth flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
        ) : (
          // Main app flow
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen 
              name="ClanDetails" 
              component={ClanDetailsScreen}
              options={{
                headerShown: true,
                title: 'Clan Details',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="ContentDetails" 
              component={ContentDetailsScreen}
              options={{
                headerShown: true,
                title: 'Content Details',
              }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{
                headerShown: true,
                title: 'Profile',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="Wallet" 
              component={WalletScreen}
              options={{
                headerShown: true,
                title: 'Wallet',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="Voting" 
              component={VotingScreen}
              options={{
                headerShown: true,
                title: 'Governance',
              }}
            />
            <Stack.Screen 
              name="ProposalDetails" 
              component={ProposalDetailsScreen}
              options={{
                headerShown: true,
                title: 'Proposal Details',
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{
                headerShown: true,
                title: 'Settings',
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen}
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};