/**
 * Notification Redux Slice
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {NotificationService} from '@/services/NotificationService';
import {Notification, NotificationType} from '@/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  pushToken: string | null;
  permissionGranted: boolean;
  loading: boolean;
  error: string | null;
  lastFetch: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  pushToken: null,
  permissionGranted: false,
  loading: false,
  error: null,
  lastFetch: null,
};

// Async Thunks
export const requestNotificationPermission = createAsyncThunk(
  'notification/requestPermission',
  async (_, {rejectWithValue}) => {
    try {
      const permission = await NotificationService.requestPermission();
      return permission;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to request notification permission');
    }
  }
);

export const registerForPushNotifications = createAsyncThunk(
  'notification/registerForPush',
  async (_, {rejectWithValue}) => {
    try {
      const token = await NotificationService.registerForPushNotifications();
      return token;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to register for push notifications');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async ({page = 1, limit = 20}: {page?: number; limit?: number} = {}, {rejectWithValue}) => {
    try {
      const notifications = await NotificationService.fetchNotifications(page, limit);
      return {notifications, page};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async ({notificationId}: {notificationId: string}, {rejectWithValue}) => {
    try {
      await NotificationService.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, {rejectWithValue}) => {
    try {
      await NotificationService.markAllAsRead();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async ({notificationId}: {notificationId: string}, {rejectWithValue}) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notification/updatePreferences',
  async (preferences: Record<NotificationType, boolean>, {rejectWithValue}) => {
    try {
      await NotificationService.updatePreferences(preferences);
      return preferences;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update notification preferences');
    }
  }
);

export const scheduleLocalNotification = createAsyncThunk(
  'notification/scheduleLocal',
  async ({
    title,
    body,
    date,
    data
  }: {
    title: string;
    body: string;
    date: Date;
    data?: any;
  }, {rejectWithValue}) => {
    try {
      const notificationId = await NotificationService.scheduleLocalNotification({
        title,
        body,
        date,
        data,
      });
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to schedule local notification');
    }
  }
);

export const cancelLocalNotification = createAsyncThunk(
  'notification/cancelLocal',
  async ({notificationId}: {notificationId: string}, {rejectWithValue}) => {
    try {
      await NotificationService.cancelLocalNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel local notification');
    }
  }
);

// Notification Slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      const existingIndex = state.notifications.findIndex(n => n.id === action.payload.id);
      if (existingIndex === -1) {
        state.notifications.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
    },
    updateNotification: (state, action: PayloadAction<Partial<Notification> & {id: string}>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        const wasUnread = !state.notifications[index].isRead;
        state.notifications[index] = {...state.notifications[index], ...action.payload};
        
        // Update unread count
        if (wasUnread && action.payload.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        } else if (!wasUnread && action.payload.isRead === false) {
          state.unreadCount += 1;
        }
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        if (!state.notifications[index].isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    setPushToken: (state, action: PayloadAction<string>) => {
      state.pushToken = action.payload;
    },
    setPermissionStatus: (state, action: PayloadAction<boolean>) => {
      state.permissionGranted = action.payload;
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter(n => !n.isRead).length;
    },
  },
  extraReducers: (builder) => {
    // Request notification permission
    builder
      .addCase(requestNotificationPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestNotificationPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.permissionGranted = action.payload;
      })
      .addCase(requestNotificationPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Register for push notifications
    builder
      .addCase(registerForPushNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerForPushNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.pushToken = action.payload;
        state.permissionGranted = true;
      })
      .addCase(registerForPushNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.page === 1) {
          state.notifications = action.payload.notifications;
        } else {
          state.notifications = [...state.notifications, ...action.payload.notifications];
        }
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
        state.lastFetch = new Date().toISOString();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder
      .addCase(markAsRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1 && !state.notifications[index].isRead) {
          state.notifications[index].isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Mark all as read
    builder
      .addCase(markAllAsRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.loading = false;
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.notifications.findIndex(n => n.id === action.payload);
        if (index !== -1) {
          if (!state.notifications[index].isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update notification preferences
    builder
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Schedule local notification
    builder
      .addCase(scheduleLocalNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(scheduleLocalNotification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(scheduleLocalNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Cancel local notification
    builder
      .addCase(cancelLocalNotification.pending, (state) => {
        state.loading = true;
      })
      .addCase(cancelLocalNotification.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(cancelLocalNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  addNotification,
  updateNotification,
  removeNotification,
  clearAllNotifications,
  setPushToken,
  setPermissionStatus,
  updateUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;