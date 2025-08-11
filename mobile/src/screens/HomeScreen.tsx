/**
 * Home Screen
 */

import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl} from 'react-native';
import {useAppSelector, useAppDispatch} from '@/store';
import {fetchContent} from '@/store/slices/contentSlice';
import {fetchNotifications} from '@/store/slices/notificationSlice';
import {GamingCard} from '@/components/gaming/GamingCard';
import {useTheme} from '@/components/theme/ThemeProvider';
import {useNavigation} from '@react-navigation/native';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  const [refreshing, setRefreshing] = useState(false);
  
  const {user} = useAppSelector(state => state.auth);
  const {content, loading: contentLoading} = useAppSelector(state => state.content);
  const {notifications} = useAppSelector(state => state.notification);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchContent()).unwrap(),
        dispatch(fetchNotifications()).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleContentPress = (contentId: string) => {
    navigation.navigate('ContentDetails' as never, {contentId} as never);
  };

  const handleContentSwipeLeft = (contentId: string) => {
    // Handle dislike/hide content
    console.log('Content swiped left:', contentId);
  };

  const handleContentSwipeRight = (contentId: string) => {
    // Handle like content
    console.log('Content swiped right:', contentId);
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <Text style={[styles.welcomeText, {color: theme.colors.textSecondary}]}>
          Welcome back,
        </Text>
        <Text style={[styles.usernameText, {color: theme.colors.text}]}>
          {user?.username || 'Gamer'}! 🎮
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Your Tokens"
          value="1,250"
          icon="💰"
          color={theme.colors.primary}
        />
        <StatCard
          title="Clan Rank"
          value="#15"
          icon="🏆"
          color={theme.colors.accent}
        />
        <StatCard
          title="Level"
          value="42"
          icon="⚡"
          color={theme.colors.secondary}
        />
      </View>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Recent Activity
          </Text>
          {notifications.slice(0, 3).map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </View>
      )}

      {/* Featured Content */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Featured Content
        </Text>
        
        {content.slice(0, 10).map((item) => (
          <GamingCard
            key={item.id}
            title={item.title}
            description={item.description}
            imageUrl={item.thumbnailUrl}
            onPress={() => handleContentPress(item.id)}
            onSwipeLeft={() => handleContentSwipeLeft(item.id)}
            onSwipeRight={() => handleContentSwipeRight(item.id)}
            onDoubleTap={() => console.log('Double tap on:', item.id)}
            enableGestures
          />
        ))}
      </View>

      <View style={{height: 20}} />
    </ScrollView>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({title, value, icon, color}) => {
  const theme = useTheme();

  return (
    <View style={[styles.statCard, {backgroundColor: theme.colors.surface}]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      <Text style={[styles.statTitle, {color: theme.colors.textSecondary}]}>{title}</Text>
    </View>
  );
};

interface NotificationItemProps {
  notification: any;
}

const NotificationItem: React.FC<NotificationItemProps> = ({notification}) => {
  const theme = useTheme();

  return (
    <View style={[styles.notificationItem, {backgroundColor: theme.colors.surface}]}>
      <View style={[styles.notificationDot, {backgroundColor: theme.colors.primary}]} />
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, {color: theme.colors.text}]}>
          {notification.title}
        </Text>
        <Text style={[styles.notificationBody, {color: theme.colors.textSecondary}]}>
          {notification.body}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 12,
  },
});