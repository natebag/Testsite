/**
 * MLG.clan State Management Examples
 * 
 * Example components demonstrating how to use the state management system
 * These examples show best practices for integrating with the MLG state
 * 
 * @version 1.0.0
 * @created 2025-08-12
 */

import React, { useEffect, useState } from 'react';
import {
  useWallet,
  useVoting,
  useClan,
  useUser,
  useSettings,
  useUI
} from '../../utils/state/index.js';

// =============================================================================
// WALLET CONNECTION EXAMPLE
// =============================================================================

export function WalletConnectionExample() {
  const wallet = useWallet();
  const { actions } = useUI();

  const handleConnect = async () => {
    try {
      actions.setLoading('wallet', true);
      
      // Simulate wallet connection
      await wallet.actions.connect({
        connect: async () => ({
          publicKey: 'ExamplePublicKey123',
          address: 'Example123...xyz',
          network: 'mainnet-beta'
        })
      });
      
      actions.addAlert({
        type: 'success',
        title: 'Wallet Connected',
        message: 'Your Phantom wallet has been connected successfully'
      });
    } catch (error) {
      actions.addAlert({
        type: 'error',
        title: 'Connection Failed',
        message: error.message
      });
    } finally {
      actions.setLoading('wallet', false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
      <h3 className="text-xl font-bold text-green-400 mb-4">Wallet Connection</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Status: {wallet.isConnected ? 'Connected' : 'Disconnected'}</div>
          <div>Network: {wallet.network}</div>
          <div>SOL Balance: {(wallet.balance / 1000000000).toFixed(4)}</div>
          <div>MLG Balance: {wallet.mlgBalance.toFixed(2)}</div>
        </div>
        
        {wallet.isConnected ? (
          <div>
            <p className="text-green-400 mb-2">Connected: {wallet.address}</p>
            <button 
              onClick={wallet.actions.disconnect}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={handleConnect}
            disabled={wallet.isConnecting}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
          >
            {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// VOTING SYSTEM EXAMPLE
// =============================================================================

export function VotingSystemExample() {
  const voting = useVoting();
  const { actions } = useUI();
  const [voteTarget, setVoteTarget] = useState('content-123');

  const handleFreeVote = async () => {
    if (voting.dailyVotesRemaining <= 0) {
      actions.addAlert({
        type: 'warning',
        title: 'No Free Votes',
        message: 'You have used all your free votes today'
      });
      return;
    }

    const voteId = `vote_${Date.now()}`;
    
    try {
      voting.actions.startVote(voteId, 'free');
      voting.actions.useFreeVote();
      
      // Simulate vote processing
      setTimeout(() => {
        voting.actions.voteSuccess(voteId, 'free', {
          target: voteTarget,
          signature: 'example_signature_' + Date.now()
        });
        
        actions.addAlert({
          type: 'success',
          title: 'Vote Submitted',
          message: 'Your free vote has been recorded'
        });
      }, 1000);
    } catch (error) {
      voting.actions.voteError(voteId, error.message);
    }
  };

  const handleBurnVote = async (amount) => {
    const voteId = `burn_vote_${Date.now()}`;
    
    try {
      voting.actions.startVote(voteId, 'burn');
      voting.actions.useBurnVote(amount);
      
      // Simulate burn-to-vote processing
      setTimeout(() => {
        voting.actions.voteSuccess(voteId, 'burn', {
          target: voteTarget,
          burnAmount: amount,
          signature: 'burn_signature_' + Date.now()
        });
        
        actions.addAlert({
          type: 'success',
          title: 'Burn Vote Submitted',
          message: `Burned ${amount} votes for enhanced voting power`
        });
      }, 1500);
    } catch (error) {
      voting.actions.voteError(voteId, error.message);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
      <h3 className="text-xl font-bold text-green-400 mb-4">Voting System</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>Free Votes Remaining: {voting.dailyVotesRemaining}</div>
          <div>Total Votes Used: {voting.totalVotesUsed}</div>
          <div>Burn Votes Available: {voting.burnVotesAvailable}</div>
          <div>Active Votes: {voting.activeVotes.length}</div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Vote Target:</label>
          <input
            type="text"
            value={voteTarget}
            onChange={(e) => setVoteTarget(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            placeholder="content-123"
          />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleFreeVote}
            disabled={voting.isVoting || voting.dailyVotesRemaining <= 0}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
          >
            Free Vote
          </button>
          
          {[1, 2, 3, 4].map(amount => (
            <button
              key={amount}
              onClick={() => handleBurnVote(amount)}
              disabled={voting.isVoting}
              className="bg-orange-600 hover:bg-orange-700 px-3 py-2 rounded disabled:opacity-50"
            >
              Burn {amount}
            </button>
          ))}
        </div>
        
        {voting.isVoting && (
          <div className="text-yellow-400">
            🔥 Processing vote...
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// CLAN MANAGEMENT EXAMPLE
// =============================================================================

export function ClanManagementExample() {
  const clan = useClan();
  const { actions } = useUI();

  const handleJoinClan = async () => {
    try {
      actions.setLoading('clan', true);
      
      // Simulate clan loading
      await clan.actions.loadClan(async () => ({
        clan: {
          id: 'clan_example',
          name: 'Example MLG Clan',
          description: 'A demonstration clan',
          tier: 'bronze',
          memberCount: 15
        },
        members: [
          { id: '1', name: 'Player1', role: 'leader', joinDate: '2025-01-01' },
          { id: '2', name: 'Player2', role: 'member', joinDate: '2025-01-15' }
        ],
        stats: {
          totalMembers: 15,
          totalVotes: 150,
          weeklyActivity: 85,
          ranking: 42
        }
      }));
      
      actions.addAlert({
        type: 'success',
        title: 'Clan Loaded',
        message: 'Clan information has been loaded successfully'
      });
    } catch (error) {
      actions.addAlert({
        type: 'error',
        title: 'Clan Load Failed',
        message: error.message
      });
    } finally {
      actions.setLoading('clan', false);
    }
  };

  const handleAddInvitation = () => {
    clan.actions.addInvitation({
      clanId: 'example_clan_2',
      clanName: 'Elite Gaming Clan',
      inviterName: 'ClanLeader123',
      message: 'Join our elite gaming community!'
    });
    
    actions.addAlert({
      type: 'info',
      title: 'Clan Invitation',
      message: 'You have received a new clan invitation'
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
      <h3 className="text-xl font-bold text-green-400 mb-4">Clan Management</h3>
      
      <div className="space-y-4">
        {clan.currentClan ? (
          <div>
            <h4 className="font-bold text-green-300">{clan.currentClan.name}</h4>
            <p className="text-sm text-gray-400">{clan.currentClan.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
              <div>Members: {clan.clanStats.totalMembers}</div>
              <div>Total Votes: {clan.clanStats.totalVotes}</div>
              <div>Weekly Activity: {clan.clanStats.weeklyActivity}%</div>
              <div>Ranking: #{clan.clanStats.ranking}</div>
            </div>
            
            <button 
              onClick={clan.actions.leaveClan}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded mt-4"
            >
              Leave Clan
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 mb-4">You are not in a clan</p>
            <button 
              onClick={handleJoinClan}
              disabled={clan.isLoading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
            >
              {clan.isLoading ? 'Loading...' : 'Join Example Clan'}
            </button>
          </div>
        )}
        
        <div>
          <h5 className="font-medium mb-2">Invitations ({clan.invitations.length})</h5>
          {clan.invitations.length > 0 ? (
            <div className="space-y-2">
              {clan.invitations.map(invite => (
                <div key={invite.id} className="bg-gray-700 p-3 rounded">
                  <div className="font-medium">{invite.clanName}</div>
                  <div className="text-sm text-gray-400">From: {invite.inviterName}</div>
                  <button 
                    onClick={() => clan.actions.removeInvitation(invite.id)}
                    className="text-red-400 text-sm mt-1"
                  >
                    Decline
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No pending invitations</p>
          )}
          
          <button 
            onClick={handleAddInvitation}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm mt-2"
          >
            Simulate Invitation
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// USER PROFILE EXAMPLE
// =============================================================================

export function UserProfileExample() {
  const user = useUser();
  const { actions } = useUI();

  const handleLoadProfile = async () => {
    try {
      actions.setLoading('user', true);
      
      await user.actions.loadUser(async () => ({
        profile: {
          id: 'user_123',
          username: 'MLGGamer2025',
          displayName: 'MLG Gamer',
          avatar: '/avatars/default.png',
          joinDate: '2025-01-01',
          bio: 'Passionate MLG platform member'
        },
        achievements: [
          {
            id: 'first_vote',
            name: 'First Vote',
            description: 'Cast your first vote on the platform',
            type: 'milestone',
            rarity: 'common',
            points: 10
          }
        ],
        stats: {
          totalVotes: 25,
          tokensEarned: 150,
          clanContributions: 5,
          joinDate: '2025-01-01'
        }
      }));
      
      actions.addAlert({
        type: 'success',
        title: 'Profile Loaded',
        message: 'User profile has been loaded successfully'
      });
    } catch (error) {
      actions.addAlert({
        type: 'error',
        title: 'Profile Load Failed',
        message: error.message
      });
    } finally {
      actions.setLoading('user', false);
    }
  };

  const handleAddAchievement = () => {
    user.actions.addAchievement({
      name: 'Daily Voter',
      description: 'Vote every day for a week',
      type: 'streak',
      rarity: 'rare',
      points: 50
    });
    
    actions.addAlert({
      type: 'success',
      title: 'Achievement Unlocked!',
      message: 'You earned the Daily Voter achievement'
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
      <h3 className="text-xl font-bold text-green-400 mb-4">User Profile</h3>
      
      <div className="space-y-4">
        {user.profile ? (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                {user.profile.displayName?.charAt(0) || 'U'}
              </div>
              <div>
                <h4 className="font-bold">{user.profile.displayName}</h4>
                <p className="text-sm text-gray-400">@{user.profile.username}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Total Votes: {user.stats.totalVotes}</div>
              <div>Tokens Earned: {user.stats.tokensEarned}</div>
              <div>Clan Contributions: {user.stats.clanContributions}</div>
              <div>Achievements: {user.achievements.length}</div>
            </div>
            
            <div className="mt-4">
              <h5 className="font-medium mb-2">Recent Achievements</h5>
              {user.achievements.slice(0, 3).map(achievement => (
                <div key={achievement.id} className="bg-gray-700 p-2 rounded mb-2">
                  <div className="font-medium text-yellow-400">{achievement.name}</div>
                  <div className="text-sm text-gray-400">{achievement.description}</div>
                  <div className="text-xs text-green-400">{achievement.points} points</div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={handleAddAchievement}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded"
            >
              Unlock Achievement
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 mb-4">No profile loaded</p>
            <button 
              onClick={handleLoadProfile}
              disabled={user.isLoading}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded disabled:opacity-50"
            >
              {user.isLoading ? 'Loading...' : 'Load Profile'}
            </button>
          </div>
        )}
        
        <div>
          <h5 className="font-medium mb-2">Notifications ({user.notifications.length})</h5>
          {user.notifications.slice(0, 3).map(notification => (
            <div key={notification.id} className="bg-gray-700 p-2 rounded mb-2 flex justify-between">
              <div>
                <div className="font-medium">{notification.title}</div>
                <div className="text-sm text-gray-400">{notification.message}</div>
              </div>
              <button 
                onClick={() => user.actions.removeNotification(notification.id)}
                className="text-red-400 text-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SETTINGS EXAMPLE
// =============================================================================

export function SettingsExample() {
  const settings = useSettings();
  const { actions } = useUI();

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-green-500">
      <h3 className="text-xl font-bold text-green-400 mb-4">Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Theme:</label>
          <select 
            value={settings.theme} 
            onChange={(e) => settings.actions.updateTheme(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
          >
            <option value="xbox">Xbox 360</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Language:</label>
          <select 
            value={settings.language} 
            onChange={(e) => settings.actions.updateLanguage(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </select>
        </div>
        
        <div>
          <h5 className="font-medium mb-2">Notifications:</h5>
          <div className="space-y-2">
            {Object.entries(settings.notifications).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => settings.actions.updateNotifications({
                    [key]: e.target.checked
                  })}
                  className="rounded"
                />
                <span className="capitalize">{key}</span>
              </label>
            ))}
          </div>
        </div>
        
        <button 
          onClick={settings.actions.reset}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// COMPLETE EXAMPLE DASHBOARD
// =============================================================================

export function StateManagementDashboard() {
  const ui = useUI();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-8">
          MLG.clan State Management Examples
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <WalletConnectionExample />
          <VotingSystemExample />
          <ClanManagementExample />
          <UserProfileExample />
          <SettingsExample />
        </div>
        
        {/* Alert System Display */}
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {ui.alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg shadow-lg max-w-sm ${
                alert.type === 'success' ? 'bg-green-600' :
                alert.type === 'error' ? 'bg-red-600' :
                alert.type === 'warning' ? 'bg-yellow-600' :
                'bg-blue-600'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">{alert.title}</h4>
                  <p className="text-sm">{alert.message}</p>
                </div>
                <button 
                  onClick={() => ui.actions.removeAlert(alert.id)}
                  className="text-white/80 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default {
  WalletConnectionExample,
  VotingSystemExample,
  ClanManagementExample,
  UserProfileExample,
  SettingsExample,
  StateManagementDashboard
};