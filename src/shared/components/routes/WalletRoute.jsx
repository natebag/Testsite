/**
 * Wallet Route Component
 * 
 * Lazy-loaded Web3 wallet interface with token management
 */

import React, { Suspense } from 'react';
import { GamingLoadingState } from '../gaming/GamingLoadingState.jsx';
import { LazyWeb3Features } from '../../router/LazyRoutes.jsx';

const WalletRoute = () => {
  return (
    <div className="wallet-route-container">
      <div className="route-header">
        <h1 className="route-title">💎 Gaming Wallet</h1>
        <p className="route-description">
          Manage your MLG tokens, track transactions, and connect to Web3 gaming
        </p>
      </div>

      <div className="route-content">
        <div className="wallet-dashboard">
          {/* Lazy-loaded Phantom wallet */}
          <Suspense fallback={
            <GamingLoadingState 
              title="Connecting to Phantom Wallet" 
              routeName="wallet"
              showTips={true}
            />
          }>
            <LazyWeb3Features.PhantomWallet />
          </Suspense>

          {/* Lazy-loaded token balance */}
          <Suspense fallback={<GamingLoadingState title="Loading Token Balance" />}>
            <LazyWeb3Features.TokenBalance />
          </Suspense>

          {/* Lazy-loaded wallet connection modal */}
          <Suspense fallback={<GamingLoadingState title="Loading Wallet Options" />}>
            <LazyWeb3Features.WalletConnect />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default WalletRoute;