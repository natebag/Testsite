/**
 * Voting Route Component
 * 
 * Lazy-loaded voting interface with optimized bundle splitting
 */

import React, { Suspense } from 'react';
import { GamingLoadingState } from '../gaming/GamingLoadingState.jsx';
import { LazyWeb3Features } from '../../router/LazyRoutes.jsx';

const VotingRoute = () => {
  return (
    <div className="voting-route-container">
      <div className="route-header">
        <h1 className="route-title">🗳️ Gaming Vote Center</h1>
        <p className="route-description">
          Burn MLG tokens to vote for your favorite content and support creators
        </p>
      </div>

      <div className="route-content">
        {/* Lazy-loaded voting interface */}
        <Suspense fallback={
          <GamingLoadingState 
            title="Loading Voting Interface" 
            routeName="voting"
            showTips={true}
          />
        }>
          <LazyWeb3Features.VotingInterface />
        </Suspense>

        {/* Lazy-loaded wallet connection */}
        <Suspense fallback={<GamingLoadingState title="Connecting Wallet" />}>
          <LazyWeb3Features.WalletConnect />
        </Suspense>

        {/* Lazy-loaded vote history */}
        <Suspense fallback={<GamingLoadingState title="Loading Vote History" />}>
          <LazyWeb3Features.VoteHistory />
        </Suspense>
      </div>
    </div>
  );
};

export default VotingRoute;