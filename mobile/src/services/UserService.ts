/**
 * User Service for Profile Management
 */

import {ApiService} from './ApiService';
import {DatabaseService} from './DatabaseService';
import {User, UserPreferences, Achievement} from '@/types';

class UserServiceClass {
  /**
   * Get user profile
   */
  async getProfile(userId?: string): Promise<User> {
    const endpoint = userId ? `/users/${userId}` : '/users/me';
    const response = await ApiService.get(endpoint);
    
    // Cache locally
    await DatabaseService.saveUser(response);
    
    return response;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await ApiService.put('/users/me', updates);
    
    // Update local cache
    await DatabaseService.updateUser(response.id, updates);
    
    return response;
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(imageUri: string): Promise<string> {
    const file = {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    };

    const response = await ApiService.uploadFile('/users/me/avatar', file);
    return response.profilePicture;
  }

  /**
   * Get user achievements
   */
  async getAchievements(): Promise<Achievement[]> {
    return await ApiService.get('/users/me/achievements');
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return await ApiService.put('/users/me/preferences', preferences);
  }
}

export const UserService = new UserServiceClass();