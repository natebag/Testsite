/**
 * Clans Route Component
 * 
 * Lazy-loaded clans interface with social gaming features
 */

import React, { Suspense } from 'react';
import { GamingLoadingState } from '../gaming/GamingLoadingState.jsx';
import { LazyWeb3Features } from '../../router/LazyRoutes.jsx';

const ClansRoute = () => {
  return (
    <div className="clans-route-container">
      <div className="route-header">
        <h1 className="route-title">🏛️ Gaming Clans</h1>
        <p className="route-description">
          Join clans, compete in tournaments, and build your gaming community
        </p>
      </div>

      <div className="route-content">
        <div className="clans-grid">
          {/* Lazy-loaded clan management */}
          <Suspense fallback={
            <GamingLoadingState 
              title="Loading Clan Management" 
              routeName="clans"
              showTips={true}
            />
          }>
            <LazyWeb3Features.ClanManagement />
          </Suspense>

          {/* Lazy-loaded leaderboards */}
          <Suspense fallback={<GamingLoadingState title="Loading Leaderboards" />}>
            <LazyWeb3Features.ClanLeaderboard />
          </Suspense>

          {/* Lazy-loaded clan invitations */}
          <Suspense fallback={<GamingLoadingState title="Loading Invitations" />}>
            <LazyWeb3Features.ClanInvitations />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default ClansRoute;