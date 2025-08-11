/**
 * Voting Service for Governance
 */

import {ApiService} from './ApiService';
import {VotingProposal} from '@/types';

class VotingServiceClass {
  /**
   * Get voting proposals
   */
  async getProposals(): Promise<{all: VotingProposal[]; active: VotingProposal[]}> {
    return await ApiService.get('/voting/proposals');
  }

  /**
   * Get proposal details
   */
  async getProposal(proposalId: string): Promise<VotingProposal> {
    return await ApiService.get(`/voting/proposals/${proposalId}`);
  }

  /**
   * Cast vote on proposal
   */
  async castVote(proposalId: string, optionId: string, tokensSpent: number): Promise<any> {
    return await ApiService.post(`/voting/proposals/${proposalId}/vote`, {
      optionId,
      tokensSpent,
    });
  }

  /**
   * Create proposal
   */
  async createProposal(proposalData: {
    title: string;
    description: string;
    type: string;
    options: string[];
    endDate: string;
    clanId?: string;
  }): Promise<VotingProposal> {
    return await ApiService.post('/voting/proposals', proposalData);
  }
}

export const VotingService = new VotingServiceClass();