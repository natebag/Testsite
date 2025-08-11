/**
 * Content Service for Content Management
 */

import {ApiService} from './ApiService';
import {DatabaseService} from './DatabaseService';
import {Content} from '@/types';

class ContentServiceClass {
  /**
   * Get content list
   */
  async getContent(page = 1, limit = 10): Promise<{content: Content[]; hasMore: boolean}> {
    const response = await ApiService.get(`/content?page=${page}&limit=${limit}`);
    
    // Cache content locally
    for (const content of response.content) {
      await DatabaseService.saveContent(content);
    }
    
    return response;
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId: string): Promise<Content> {
    const response = await ApiService.get(`/content/${contentId}`);
    await DatabaseService.saveContent(response);
    return response;
  }

  /**
   * Submit content
   */
  async submitContent(contentData: {
    title: string;
    description: string;
    type: string;
    mediaFile?: {uri: string; type: string; name: string};
    tags: string[];
  }): Promise<Content> {
    let response;
    
    if (contentData.mediaFile) {
      response = await ApiService.uploadFile('/content', contentData.mediaFile, {
        title: contentData.title,
        description: contentData.description,
        type: contentData.type,
        tags: JSON.stringify(contentData.tags),
      });
    } else {
      response = await ApiService.post('/content', {
        title: contentData.title,
        description: contentData.description,
        type: contentData.type,
        tags: contentData.tags,
      });
    }

    await DatabaseService.saveContent(response);
    return response;
  }

  /**
   * Vote on content
   */
  async voteOnContent(contentId: string, voteType: 'up' | 'down' | 'burn', tokensSpent: number): Promise<any> {
    return await ApiService.post(`/content/${contentId}/vote`, {
      type: voteType,
      tokensSpent,
    });
  }

  /**
   * Add comment to content
   */
  async addComment(contentId: string, comment: string, parentId?: string): Promise<any> {
    return await ApiService.post(`/content/${contentId}/comments`, {
      content: comment,
      parentId,
    });
  }
}

export const ContentService = new ContentServiceClass();