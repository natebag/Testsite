/**
 * Clan Service for Clan Management
 */

import {ApiService} from './ApiService';
import {DatabaseService} from './DatabaseService';
import {Clan} from '@/types';

class ClanServiceClass {
  /**
   * Get user's clans
   */
  async getUserClans(): Promise<Clan[]> {
    const response = await ApiService.get('/clans/user');
    
    // Cache clans locally
    for (const clan of response) {
      await DatabaseService.saveClan(clan);
    }
    
    return response;
  }

  /**
   * Get clan details
   */
  async getClan(clanId: string): Promise<Clan> {
    const response = await ApiService.get(`/clans/${clanId}`);
    
    // Cache locally
    await DatabaseService.saveClan(response);
    
    return response;
  }

  /**
   * Join clan
   */
  async joinClan(clanId: string): Promise<any> {
    return await ApiService.post(`/clans/${clanId}/join`);
  }

  /**
   * Leave clan
   */
  async leaveClan(clanId: string): Promise<void> {
    await ApiService.post(`/clans/${clanId}/leave`);
  }

  /**
   * Create clan
   */
  async createClan(clanData: {name: string; description: string; isPublic: boolean}): Promise<Clan> {
    const response = await ApiService.post('/clans', clanData);
    await DatabaseService.saveClan(response);
    return response;
  }
}

export const ClanService = new ClanServiceClass();