/**
 * Cross-Platform Data Synchronization Service
 * Handles real-time sync between mobile and web platforms
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {ApiService} from './ApiService';
import {DatabaseService} from './DatabaseService';
import {PendingAction, SyncConflict, ActionType} from '@/types';

interface SyncOptions {
  priority: 'high' | 'medium' | 'low';
  retryAttempts: number;
  batchSize: number;
  syncInterval: number;
}

interface SyncResult {
  successful: string[];
  failed: string[];
  conflicts: SyncConflict[];
}

class SyncServiceClass {
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline = false;
  private isSyncing = false;
  private websocket: WebSocket | null = null;
  private pendingActions: Map<string, PendingAction> = new Map();
  private syncListeners: Set<(data: any) => void> = new Set();

  constructor() {
    this.setupNetworkListener();
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    try {
      // Check network status
      const networkState = await NetInfo.fetch();
      this.isOnline = networkState.isConnected ?? false;

      // Load pending actions from storage
      await this.loadPendingActions();

      // Setup WebSocket connection for real-time sync
      if (this.isOnline) {
        await this.setupWebSocketConnection();
      }

      // Start periodic sync
      this.startPeriodicSync();

      console.log('SyncService initialized');
    } catch (error) {
      console.error('Failed to initialize SyncService:', error);
    }
  }

  /**
   * Perform full synchronization
   */
  async performFullSync(currentState: any): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;

    try {
      const result: SyncResult = {
        successful: [],
        failed: [],
        conflicts: [],
      };

      // Get last sync timestamp
      const lastSync = await AsyncStorage.getItem('last_sync_timestamp');
      const syncTimestamp = lastSync || new Date(0).toISOString();

      // Sync different data types
      await this.syncUserData(currentState.user, result);
      await this.syncClanData(currentState.clan, result);
      await this.syncContentData(currentState.content, result);
      await this.syncVotingData(currentState.voting, result);
      await this.syncNotifications(currentState.notification, result);

      // Sync pending actions
      const pendingResult = await this.syncPendingActions(Array.from(this.pendingActions.values()));
      result.successful.push(...pendingResult.successful);
      result.failed.push(...pendingResult.failed);
      result.conflicts.push(...pendingResult.conflicts);

      // Update last sync timestamp
      await AsyncStorage.setItem('last_sync_timestamp', new Date().toISOString());

      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Perform incremental sync since timestamp
   */
  async incrementalSync(timestamp: string): Promise<SyncResult> {
    try {
      const response = await ApiService.get(`/sync/incremental?since=${timestamp}`);
      
      const result: SyncResult = {
        successful: [],
        failed: [],
        conflicts: [],
      };

      // Apply incremental updates
      for (const update of response.updates) {
        try {
          await this.applyUpdate(update);
          result.successful.push(update.id);
        } catch (error) {
          console.error('Failed to apply update:', error);
          result.failed.push(update.id);
        }
      }

      // Handle conflicts
      for (const conflict of response.conflicts) {
        result.conflicts.push(conflict);
      }

      return result;
    } catch (error: any) {
      throw new Error(`Incremental sync failed: ${error.message}`);
    }
  }

  /**
   * Queue action for later sync
   */
  async queueAction(type: ActionType, data: any): Promise<PendingAction> {
    const action: PendingAction = {
      id: this.generateActionId(),
      type,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    this.pendingActions.set(action.id, action);
    await this.savePendingActions();

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.syncPendingActions([action]).catch(console.error);
    }

    return action;
  }

  /**
   * Sync pending actions
   */
  async syncPendingActions(actions: PendingAction[]): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    const result: SyncResult = {
      successful: [],
      failed: [],
      conflicts: [],
    };

    const batchSize = 10;
    const batches = this.chunkArray(actions, batchSize);

    for (const batch of batches) {
      try {
        const response = await ApiService.post('/sync/actions', {
          actions: batch,
        });

        // Process results
        for (const actionResult of response.results) {
          if (actionResult.success) {
            result.successful.push(actionResult.actionId);
            this.pendingActions.delete(actionResult.actionId);
          } else {
            result.failed.push(actionResult.actionId);
            
            // Increment retry count
            const action = this.pendingActions.get(actionResult.actionId);
            if (action) {
              action.retries += 1;
              if (action.retries >= 5) {
                // Remove actions that have failed too many times
                this.pendingActions.delete(actionResult.actionId);
                console.warn(`Removing action ${actionResult.actionId} after 5 failed attempts`);
              }
            }
          }
        }

        // Handle conflicts
        if (response.conflicts) {
          result.conflicts.push(...response.conflicts);
        }
      } catch (error) {
        console.error('Batch sync failed:', error);
        batch.forEach(action => result.failed.push(action.id));
      }
    }

    await this.savePendingActions();
    return result;
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(
    conflictId: string, 
    resolution: 'local' | 'server' | 'merge',
    selectedData?: any
  ): Promise<any> {
    try {
      const response = await ApiService.post(`/sync/conflicts/${conflictId}/resolve`, {
        resolution,
        selectedData,
      });

      // Apply resolution locally
      await this.applyUpdate(response.resolvedData);

      return response.resolvedData;
    } catch (error: any) {
      throw new Error(`Failed to resolve conflict: ${error.message}`);
    }
  }

  /**
   * Check connectivity status
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      const networkState = await NetInfo.fetch();
      return networkState.isConnected ?? false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add sync listener
   */
  addSyncListener(listener: (data: any) => void): void {
    this.syncListeners.add(listener);
  }

  /**
   * Remove sync listener
   */
  removeSyncListener(listener: (data: any) => void): void {
    this.syncListeners.delete(listener);
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    // Sync every 30 seconds when online
    this.syncTimer = setInterval(async () => {
      if (this.isOnline && !this.isSyncing && this.pendingActions.size > 0) {
        try {
          await this.syncPendingActions(Array.from(this.pendingActions.values()));
        } catch (error) {
          console.warn('Periodic sync failed:', error);
        }
      }
    }, 30000);
  }

  /**
   * Setup WebSocket connection for real-time sync
   */
  private async setupWebSocketConnection(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        return;
      }

      const wsUrl = process.env.WS_URL || 'wss://ws.mlg.clan';
      this.websocket = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);

      this.websocket.onopen = () => {
        console.log('WebSocket connected for real-time sync');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.websocket = null;
        
        // Attempt to reconnect after delay
        if (this.isOnline) {
          setTimeout(() => {
            this.setupWebSocketConnection();
          }, 5000);
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  }

  /**
   * Handle real-time updates from WebSocket
   */
  private handleRealtimeUpdate(data: any): void {
    try {
      // Apply update locally
      this.applyUpdate(data);

      // Notify listeners
      this.syncListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Sync listener error:', error);
        }
      });
    } catch (error) {
      console.error('Failed to handle real-time update:', error);
    }
  }

  /**
   * Apply update to local storage
   */
  private async applyUpdate(update: any): Promise<void> {
    try {
      switch (update.type) {
        case 'user_update':
          await DatabaseService.updateUser(update.userId, update.data);
          break;
        case 'clan_update':
          await DatabaseService.updateClan(update.clanId, update.data);
          break;
        case 'content_update':
          await DatabaseService.updateContent(update.contentId, update.data);
          break;
        case 'vote_update':
          await DatabaseService.updateVote(update.voteId, update.data);
          break;
        case 'notification_update':
          await DatabaseService.updateNotification(update.notificationId, update.data);
          break;
        default:
          console.warn('Unknown update type:', update.type);
      }
    } catch (error) {
      console.error('Failed to apply update:', error);
      throw error;
    }
  }

  /**
   * Sync user data
   */
  private async syncUserData(userData: any, result: SyncResult): Promise<void> {
    try {
      if (userData?.profile?.updatedAt) {
        const response = await ApiService.get(`/sync/user/${userData.profile.id}?since=${userData.profile.updatedAt}`);
        
        if (response.hasUpdates) {
          await DatabaseService.updateUser(userData.profile.id, response.data);
          result.successful.push(`user_${userData.profile.id}`);
        }
      }
    } catch (error) {
      console.error('User data sync failed:', error);
      result.failed.push('user_data');
    }
  }

  /**
   * Sync clan data
   */
  private async syncClanData(clanData: any, result: SyncResult): Promise<void> {
    try {
      if (clanData?.currentClan?.id) {
        const response = await ApiService.get(`/sync/clan/${clanData.currentClan.id}`);
        
        if (response.hasUpdates) {
          await DatabaseService.updateClan(clanData.currentClan.id, response.data);
          result.successful.push(`clan_${clanData.currentClan.id}`);
        }
      }
    } catch (error) {
      console.error('Clan data sync failed:', error);
      result.failed.push('clan_data');
    }
  }

  /**
   * Sync content data
   */
  private async syncContentData(contentData: any, result: SyncResult): Promise<void> {
    try {
      const lastSync = await AsyncStorage.getItem('content_last_sync');
      const response = await ApiService.get(`/sync/content?since=${lastSync || '0'}`);
      
      for (const content of response.updates) {
        await DatabaseService.updateContent(content.id, content);
        result.successful.push(`content_${content.id}`);
      }

      await AsyncStorage.setItem('content_last_sync', new Date().toISOString());
    } catch (error) {
      console.error('Content data sync failed:', error);
      result.failed.push('content_data');
    }
  }

  /**
   * Sync voting data
   */
  private async syncVotingData(votingData: any, result: SyncResult): Promise<void> {
    try {
      const lastSync = await AsyncStorage.getItem('voting_last_sync');
      const response = await ApiService.get(`/sync/voting?since=${lastSync || '0'}`);
      
      for (const vote of response.updates) {
        await DatabaseService.updateVote(vote.id, vote);
        result.successful.push(`vote_${vote.id}`);
      }

      await AsyncStorage.setItem('voting_last_sync', new Date().toISOString());
    } catch (error) {
      console.error('Voting data sync failed:', error);
      result.failed.push('voting_data');
    }
  }

  /**
   * Sync notifications
   */
  private async syncNotifications(notificationData: any, result: SyncResult): Promise<void> {
    try {
      const lastSync = await AsyncStorage.getItem('notifications_last_sync');
      const response = await ApiService.get(`/sync/notifications?since=${lastSync || '0'}`);
      
      for (const notification of response.updates) {
        await DatabaseService.updateNotification(notification.id, notification);
        result.successful.push(`notification_${notification.id}`);
      }

      await AsyncStorage.setItem('notifications_last_sync', new Date().toISOString());
    } catch (error) {
      console.error('Notifications sync failed:', error);
      result.failed.push('notifications_data');
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Came back online
        console.log('Network connection restored - resuming sync');
        this.setupWebSocketConnection();
        
        // Trigger sync of pending actions
        if (this.pendingActions.size > 0) {
          this.syncPendingActions(Array.from(this.pendingActions.values())).catch(console.error);
        }
      } else if (wasOnline && !this.isOnline) {
        // Went offline
        console.log('Network connection lost - entering offline mode');
        if (this.websocket) {
          this.websocket.close();
          this.websocket = null;
        }
      }
    });
  }

  /**
   * Load pending actions from storage
   */
  private async loadPendingActions(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('pending_sync_actions');
      if (stored) {
        const actions: PendingAction[] = JSON.parse(stored);
        this.pendingActions.clear();
        actions.forEach(action => {
          this.pendingActions.set(action.id, action);
        });
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  }

  /**
   * Save pending actions to storage
   */
  private async savePendingActions(): Promise<void> {
    try {
      const actions = Array.from(this.pendingActions.values());
      await AsyncStorage.setItem('pending_sync_actions', JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to save pending actions:', error);
    }
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.syncListeners.clear();
  }
}

export const SyncService = new SyncServiceClass();