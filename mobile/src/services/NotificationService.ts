/**
 * Push Notification Service
 * Handles push notifications, local notifications, and notification management
 */

import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import {Platform, Alert, PermissionsAndroid} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import {ApiService} from './ApiService';
import {Notification, NotificationType} from '@/types';

interface NotificationPreferences {
  governance: boolean;
  clanActivities: boolean;
  tournaments: boolean;
  achievements: boolean;
  marketing: boolean;
}

interface LocalNotificationConfig {
  title: string;
  body: string;
  date: Date;
  data?: any;
  sound?: string;
  vibrate?: boolean;
  priority?: 'high' | 'normal' | 'low';
}

class NotificationServiceClass {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private preferences: NotificationPreferences | null = null;

  constructor() {
    this.setupPushNotifications();
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Request permission
      const permission = await this.requestPermission();
      if (!permission) {
        console.warn('Notification permission denied');
        return;
      }

      // Get FCM token
      await this.getFCMToken();

      // Setup notification handlers
      this.setupNotificationHandlers();

      // Load preferences
      await this.loadPreferences();

      this.isInitialized = true;
      console.log('NotificationService initialized');
    } catch (error) {
      console.error('Failed to initialize NotificationService:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'MLG.clan needs permission to send you important updates about clans, governance, and tournaments.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
               authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get FCM token
   */
  async registerForPushNotifications(): Promise<string> {
    try {
      const permission = await this.requestPermission();
      if (!permission) {
        throw new Error('Notification permission required');
      }

      const token = await messaging().getToken();
      this.fcmToken = token;

      // Save token to server
      await this.registerTokenWithServer(token);

      // Store token locally
      await EncryptedStorage.setItem('fcm_token', token);

      return token;
    } catch (error: any) {
      throw new Error(`Failed to register for push notifications: ${error.message}`);
    }
  }

  /**
   * Get FCM token
   */
  private async getFCMToken(): Promise<void> {
    try {
      const token = await messaging().getToken();
      if (token !== this.fcmToken) {
        this.fcmToken = token;
        await EncryptedStorage.setItem('fcm_token', token);
        await this.registerTokenWithServer(token);
      }
    } catch (error) {
      console.error('Failed to get FCM token:', error);
    }
  }

  /**
   * Register token with server
   */
  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await ApiService.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceInfo: {
          model: Platform.constants.Model || 'Unknown',
          version: Platform.Version,
        },
      });
    } catch (error) {
      console.error('Failed to register token with server:', error);
    }
  }

  /**
   * Setup push notification handlers
   */
  private setupNotificationHandlers(): void {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('FCM message received in foreground:', remoteMessage);
      this.handleForegroundNotification(remoteMessage);
    });

    // Handle background/quit state messages
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Handle app launch from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = token;
      this.registerTokenWithServer(token);
    });
  }

  /**
   * Setup local push notifications
   */
  private setupPushNotifications(): void {
    PushNotification.configure({
      // Called when token is generated
      onRegister: function (token) {
        console.log('Local push token:', token);
      },

      // Called when a remote/local notification is opened/tapped
      onNotification: (notification) => {
        console.log('Local notification:', notification);
        this.handleLocalNotification(notification);
      },

      // Called when remote notification is received (Android only)
      onRemoteNotification: (notification) => {
        console.log('Remote notification (local):', notification);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create default notification channels (Android)
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'governance',
          channelName: 'Governance Notifications',
          channelDescription: 'Notifications about governance proposals and voting',
          importance: 4,
          vibrate: true,
        },
        (created) => console.log(`Governance channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'clan',
          channelName: 'Clan Activities',
          channelDescription: 'Notifications about clan events and activities',
          importance: 3,
          vibrate: true,
        },
        (created) => console.log(`Clan channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'tournaments',
          channelName: 'Tournaments',
          channelDescription: 'Tournament reminders and updates',
          importance: 3,
          vibrate: true,
        },
        (created) => console.log(`Tournaments channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'achievements',
          channelName: 'Achievements',
          channelDescription: 'Achievement unlocks and rewards',
          importance: 2,
          vibrate: false,
        },
        (created) => console.log(`Achievements channel created: ${created}`)
      );
    }
  }

  /**
   * Handle foreground notifications
   */
  private handleForegroundNotification(remoteMessage: any): void {
    if (!remoteMessage.notification) {
      return;
    }

    const { title, body } = remoteMessage.notification;
    const data = remoteMessage.data || {};

    // Show local notification for foreground messages
    PushNotification.localNotification({
      title,
      message: body,
      userInfo: data,
      playSound: true,
      soundName: 'default',
      channelId: this.getChannelId(data.type),
    });
  }

  /**
   * Handle notification press/tap
   */
  private handleNotificationPress(remoteMessage: any): void {
    const data = remoteMessage.data || {};
    
    // Navigate based on notification type
    switch (data.type) {
      case 'governance_proposal':
        // Navigate to proposal details
        console.log('Navigate to proposal:', data.proposalId);
        break;
      case 'clan_invitation':
        // Navigate to clan invitation
        console.log('Navigate to clan invitation:', data.clanId);
        break;
      case 'tournament_reminder':
        // Navigate to tournament
        console.log('Navigate to tournament:', data.tournamentId);
        break;
      case 'achievement_unlocked':
        // Show achievement details
        console.log('Show achievement:', data.achievementId);
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  /**
   * Handle local notification interactions
   */
  private handleLocalNotification(notification: any): void {
    if (notification.userInteraction) {
      // User tapped on notification
      this.handleNotificationPress({ data: notification.userInfo });
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(config: LocalNotificationConfig): Promise<string> {
    const notificationId = Date.now().toString();

    PushNotification.localNotificationSchedule({
      id: notificationId,
      title: config.title,
      message: config.body,
      date: config.date,
      userInfo: config.data || {},
      playSound: config.sound !== undefined ? !!config.sound : true,
      soundName: config.sound || 'default',
      vibrate: config.vibrate !== false,
      channelId: this.getChannelId(config.data?.type),
      priority: config.priority || 'normal',
    });

    return notificationId;
  }

  /**
   * Cancel local notification
   */
  async cancelLocalNotification(notificationId: string): Promise<void> {
    PushNotification.cancelLocalNotifications({ id: notificationId });
  }

  /**
   * Cancel all local notifications
   */
  async cancelAllLocalNotifications(): Promise<void> {
    PushNotification.cancelAllLocalNotifications();
  }

  /**
   * Fetch notifications from server
   */
  async fetchNotifications(page = 1, limit = 20): Promise<Notification[]> {
    try {
      const response = await ApiService.get(`/notifications?page=${page}&limit=${limit}`);
      return response.notifications;
    } catch (error: any) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await ApiService.post(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await ApiService.post('/notifications/read-all');
    } catch (error: any) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await ApiService.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await ApiService.post('/notifications/preferences', preferences);
      
      this.preferences = preferences;
      await EncryptedStorage.setItem('notification_preferences', JSON.stringify(preferences));
    } catch (error: any) {
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    if (this.preferences) {
      return this.preferences;
    }

    try {
      const saved = await EncryptedStorage.getItem('notification_preferences');
      if (saved) {
        this.preferences = JSON.parse(saved);
        return this.preferences;
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }

    // Default preferences
    const defaultPreferences: NotificationPreferences = {
      governance: true,
      clanActivities: true,
      tournaments: true,
      achievements: true,
      marketing: false,
    };

    this.preferences = defaultPreferences;
    return defaultPreferences;
  }

  /**
   * Load preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const saved = await EncryptedStorage.getItem('notification_preferences');
      if (saved) {
        this.preferences = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  /**
   * Get notification channel ID based on type
   */
  private getChannelId(type?: string): string {
    switch (type) {
      case 'governance_proposal':
      case 'vote_reminder':
        return 'governance';
      case 'clan_invitation':
      case 'clan_announcement':
        return 'clan';
      case 'tournament_reminder':
        return 'tournaments';
      case 'achievement_unlocked':
        return 'achievements';
      default:
        return 'default';
    }
  }

  /**
   * Show notification permission prompt
   */
  async promptForPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Enable Notifications',
        'Stay updated with clan activities, governance proposals, and tournament reminders.',
        [
          {
            text: 'Not Now',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Enable',
            onPress: async () => {
              const permission = await this.requestPermission();
              resolve(permission);
            },
          },
        ]
      );
    });
  }

  /**
   * Test notification (development only)
   */
  async testNotification(type: NotificationType = 'clan_announcement'): Promise<void> {
    if (__DEV__) {
      PushNotification.localNotification({
        title: 'Test Notification',
        message: 'This is a test notification from MLG.clan',
        userInfo: { type, test: true },
        channelId: this.getChannelId(type),
      });
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      const response = await ApiService.get('/notifications/unread-count');
      return response.count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Update badge count
   */
  updateBadgeCount(count: number): void {
    if (Platform.OS === 'ios') {
      PushNotification.setApplicationIconBadgeNumber(count);
    }
  }

  /**
   * Clear badge
   */
  clearBadge(): void {
    if (Platform.OS === 'ios') {
      PushNotification.setApplicationIconBadgeNumber(0);
    }
  }

  /**
   * Cleanup notification service
   */
  cleanup(): void {
    PushNotification.cancelAllLocalNotifications();
    this.fcmToken = null;
    this.preferences = null;
    this.isInitialized = false;
  }
}

export const NotificationService = new NotificationServiceClass();