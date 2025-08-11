/**
 * Main Tab Navigation
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Platform} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {MainTabParamList} from '@/types';
import {useAppSelector} from '@/store';

// Screens
import {HomeScreen} from '@/screens/HomeScreen';
import {ClansScreen} from '@/screens/ClansScreen';
import {ContentScreen} from '@/screens/ContentScreen';
import {VotingScreen} from '@/screens/VotingScreen';
import {ProfileScreen} from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  const {unreadCount} = useAppSelector(state => state.notification);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Clans':
              iconName = 'groups';
              break;
            case 'Content':
              iconName = 'video-library';
              break;
            case 'Voting':
              iconName = 'how-to-vote';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#00ff88',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        headerStyle: {
          backgroundColor: '#1a1a1a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          title: 'Home',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen 
        name="Clans" 
        component={ClansScreen} 
        options={{
          title: 'Clans',
        }}
      />
      <Tab.Screen 
        name="Content" 
        component={ContentScreen} 
        options={{
          title: 'Content',
        }}
      />
      <Tab.Screen 
        name="Voting" 
        component={VotingScreen} 
        options={{
          title: 'Governance',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};