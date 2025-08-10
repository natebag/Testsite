/**
 * Network Validation Demo for MLG.clan Phantom Wallet Integration
 * 
 * This demo shows how to use the enhanced network validation features
 * including network detection, RPC endpoint validation, and network mismatch handling.
 */

import { PhantomWalletManager } from './phantom-wallet.js';
import { SOLANA_NETWORKS, CURRENT_NETWORK } from '../../config/solana-config.js';

/**
 * Demo class for showcasing network validation features
 */
class NetworkValidationDemo {
  constructor() {
    this.walletManager = new PhantomWalletManager();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for network validation events
   */
  setupEventListeners() {
    // Network validation events
    this.walletManager.on('networkMismatch', this.handleNetworkMismatch.bind(this));
    this.walletManager.on('networkChanged', this.handleNetworkChanged.bind(this));
    this.walletManager.on('networkHealthCheck', this.handleNetworkHealthCheck.bind(this));
    this.walletManager.on('networkHealthCheckFailed', this.handleNetworkHealthCheckFailed.bind(this));
    this.walletManager.on('networkSwitchRequested', this.handleNetworkSwitchRequested.bind(this));
    this.walletManager.on('networkValidationSettingsUpdated', this.handleValidationSettingsUpdated.bind(this));

    // Connection events with network context
    this.walletManager.on('connected', this.handleConnectionSuccess.bind(this));
    this.walletManager.on('connectionFailed', this.handleConnectionFailed.bind(this));
  }

  /**
   * Handle network mismatch scenarios
   */
  handleNetworkMismatch(event) {
    console.warn('Network Mismatch Detected:', event);
    
    const { walletNetwork, requiredNetwork, canSwitch, error } = event;
    
    // Display user-friendly message
    const message = `Your wallet is connected to ${walletNetwork} but this application requires ${requiredNetwork}.`;
    
    if (canSwitch) {
      console.log('Network switching available - requesting automatic switch');
      this.requestNetworkSwitch(requiredNetwork);
    } else {
      console.log('Manual network switch required');
      this.displayNetworkSwitchInstructions(walletNetwork, requiredNetwork);
    }
  }

  /**
   * Handle network change events
   */
  handleNetworkChanged(event) {
    console.log('Network Changed:', event);
    
    const { previousNetwork, newNetwork, timestamp } = event;
    console.log(`Network switched from ${previousNetwork} to ${newNetwork}`);
    
    // Update UI to reflect network change
    this.updateNetworkDisplay(newNetwork);
  }

  /**
   * Handle network health check results
   */
  handleNetworkHealthCheck(event) {
    console.log('Network Health Check:', event);
    
    const { network, healthy, latency, timestamp } = event;
    
    if (healthy) {
      console.log(`✅ Network ${network} is healthy (${latency}ms)`);
    } else {
      console.warn(`⚠️ Network ${network} health issues detected`);
    }
    
    this.updateNetworkHealthDisplay(event);
  }

  /**
   * Handle network health check failures
   */
  handleNetworkHealthCheckFailed(event) {
    console.error('Network Health Check Failed:', event);
    
    const { network, error, timestamp } = event;
    console.error(`❌ Network ${network} health check failed: ${error}`);
    
    this.displayNetworkHealthWarning(network, error);
  }

  /**
   * Handle network switch requests
   */
  handleNetworkSwitchRequested(event) {
    console.log('Network Switch Requested:', event);
    
    const { currentNetwork, targetNetwork, requiresManualSwitch } = event;
    
    if (requiresManualSwitch) {
      this.displayManualNetworkSwitchInstructions(currentNetwork, targetNetwork);
    }
  }

  /**
   * Handle validation settings updates
   */
  handleValidationSettingsUpdated(event) {
    console.log('Network Validation Settings Updated:', event);
  }

  /**
   * Handle successful connection with network info
   */
  handleConnectionSuccess(connectionInfo) {
    console.log('Wallet Connected with Network Validation:', connectionInfo);
    
    const { 
      network, 
      targetNetwork, 
      networkCompatible,
      networkValidationEnabled,
      rpcEndpointHealthy 
    } = connectionInfo;
    
    console.log(`Connected to ${network} (target: ${targetNetwork})`);
    console.log(`Network compatible: ${networkCompatible}`);
    console.log(`Validation enabled: ${networkValidationEnabled}`);
    console.log(`RPC endpoint healthy: ${rpcEndpointHealthy}`);
  }

  /**
   * Handle connection failures with network context
   */
  handleConnectionFailed(event) {
    console.error('Connection Failed:', event);
    
    const { error } = event;
    
    // Check if it's a network-related error
    if (this.isNetworkError(error)) {
      console.error('Network-related connection failure:', error.type);
      this.handleNetworkConnectionError(error);
    }
  }

  /**
   * Demo: Connect wallet with network validation
   */
  async demonstrateWalletConnection() {
    console.log('\n=== Wallet Connection with Network Validation Demo ===');
    
    try {
      // Display current network configuration
      console.log('Current Configuration:');
      console.log(`Target Network: ${CURRENT_NETWORK}`);
      console.log(`Supported Networks: ${this.walletManager.supportedNetworks.join(', ')}`);
      console.log(`Validation Enabled: ${this.walletManager.networkValidationEnabled}`);
      
      // Get network status before connection
      const networkStatus = this.walletManager.getNetworkStatus();
      console.log('\nNetwork Status:', networkStatus);
      
      // Validate network configuration
      const configValidation = this.walletManager.validateNetworkConfiguration();
      console.log('\nNetwork Configuration Validation:', configValidation);
      
      if (!configValidation.valid) {
        console.error('Network configuration issues:', configValidation.issues);
        return;
      }
      
      // Connect wallet
      console.log('\nAttempting wallet connection...');
      const connectionResult = await this.walletManager.connect();
      
      console.log('Connection successful:', connectionResult);
      
      // Display post-connection network info
      const postConnectionStatus = this.walletManager.getNetworkStatus();
      console.log('\nPost-Connection Network Status:', postConnectionStatus);
      
    } catch (error) {
      console.error('Connection demo failed:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Demo: Network validation settings management
   */
  async demonstrateNetworkValidationSettings() {
    console.log('\n=== Network Validation Settings Demo ===');
    
    // Display current settings
    const currentStatus = this.walletManager.getNetworkStatus();
    console.log('Current Settings:', {
      networkValidationEnabled: currentStatus.networkValidationEnabled,
      supportedNetworks: currentStatus.supportedNetworks,
      networkCheckInterval: currentStatus.networkCheckInterval
    });
    
    // Update settings
    console.log('\nUpdating network validation settings...');
    this.walletManager.updateNetworkValidationSettings({
      enabled: true,
      supportedNetworks: [SOLANA_NETWORKS.DEVNET, SOLANA_NETWORKS.MAINNET],
      checkInterval: 15000, // 15 seconds
      strictValidation: true
    });
    
    // Display updated settings
    const updatedStatus = this.walletManager.getNetworkStatus();
    console.log('Updated Settings:', {
      networkValidationEnabled: updatedStatus.networkValidationEnabled,
      supportedNetworks: updatedStatus.supportedNetworks,
      networkCheckInterval: updatedStatus.networkCheckInterval
    });
  }

  /**
   * Demo: RPC endpoint health monitoring
   */
  async demonstrateRpcHealthMonitoring() {
    console.log('\n=== RPC Health Monitoring Demo ===');
    
    const networkStatus = this.walletManager.getNetworkStatus();
    
    console.log('RPC Endpoint Health Status:');
    console.log('Available Endpoints:', networkStatus.availableEndpoints);
    console.log('Health Status:', networkStatus.rpcHealthStatus);
    console.log('Connection Healthy:', networkStatus.connectionHealthy);
    console.log('RPC Latency:', networkStatus.rpcLatency);
    console.log('Last Check:', new Date(networkStatus.lastNetworkCheck).toISOString());
  }

  /**
   * Demo: Manual network switch simulation
   */
  async demonstrateNetworkSwitchHandling() {
    console.log('\n=== Network Switch Handling Demo ===');
    
    try {
      // Attempt to request network switch
      console.log('Requesting network switch...');
      
      const targetNetwork = this.walletManager.currentNetwork === SOLANA_NETWORKS.DEVNET 
        ? SOLANA_NETWORKS.MAINNET 
        : SOLANA_NETWORKS.DEVNET;
      
      await this.walletManager.requestNetworkSwitch(targetNetwork);
      
    } catch (error) {
      console.log('Network switch request result:', error.message);
      
      if (error.type === 'NETWORK_SWITCH_REQUIRED') {
        console.log('Manual network switch required - displaying instructions');
        this.displayNetworkSwitchInstructions(this.walletManager.currentNetwork, targetNetwork);
      }
    }
  }

  // Helper methods for UI updates (would integrate with actual UI)

  /**
   * Request automatic network switch
   */
  async requestNetworkSwitch(targetNetwork) {
    try {
      await this.walletManager.requestNetworkSwitch(targetNetwork);
    } catch (error) {
      console.error('Network switch request failed:', error);
    }
  }

  /**
   * Display network switch instructions
   */
  displayNetworkSwitchInstructions(currentNetwork, targetNetwork) {
    console.log('\n📋 Manual Network Switch Instructions:');
    console.log(`1. Open your Phantom wallet`);
    console.log(`2. Click on the network selector (currently: ${currentNetwork})`);
    console.log(`3. Select "${targetNetwork}"`);
    console.log(`4. Return to this application and try connecting again`);
  }

  /**
   * Display manual network switch instructions
   */
  displayManualNetworkSwitchInstructions(currentNetwork, targetNetwork) {
    console.log('\n🔄 Network Switch Required:');
    console.log(`Please switch your wallet from ${currentNetwork} to ${targetNetwork}`);
    this.displayNetworkSwitchInstructions(currentNetwork, targetNetwork);
  }

  /**
   * Update network display
   */
  updateNetworkDisplay(network) {
    console.log(`🌐 Network Updated: ${network}`);
  }

  /**
   * Update network health display
   */
  updateNetworkHealthDisplay(healthInfo) {
    const status = healthInfo.healthy ? '🟢' : '🔴';
    console.log(`${status} Network Health: ${healthInfo.network} (${healthInfo.latency}ms)`);
  }

  /**
   * Display network health warning
   */
  displayNetworkHealthWarning(network, error) {
    console.warn(`⚠️ Network Health Warning: ${network} - ${error}`);
  }

  /**
   * Check if error is network-related
   */
  isNetworkError(error) {
    const networkErrorTypes = [
      'NETWORK_ERROR',
      'NETWORK_MISMATCH',
      'NETWORK_VALIDATION_FAILED',
      'RPC_ENDPOINT_FAILED',
      'CLUSTER_HEALTH_FAILED',
      'NETWORK_SWITCH_REQUIRED',
      'RPC_ERROR'
    ];
    
    return networkErrorTypes.includes(error.type);
  }

  /**
   * Handle network connection errors
   */
  handleNetworkConnectionError(error) {
    console.error('Network Connection Error Handler:', error);
    
    switch (error.type) {
      case 'NETWORK_MISMATCH':
        console.log('Handling network mismatch...');
        break;
      case 'RPC_ENDPOINT_FAILED':
        console.log('All RPC endpoints failed - checking alternatives...');
        break;
      case 'CLUSTER_HEALTH_FAILED':
        console.log('Network health issues detected - advising user...');
        break;
      default:
        console.log('General network error - providing fallback options...');
    }
  }

  /**
   * Handle general connection errors
   */
  handleConnectionError(error) {
    console.error('Connection Error:', error);
    
    if (this.isNetworkError(error)) {
      this.handleNetworkConnectionError(error);
    } else {
      console.log('Non-network connection error:', error.type);
    }
  }

  /**
   * Run all network validation demos
   */
  async runAllDemos() {
    console.log('🚀 Starting Network Validation Demos');
    
    try {
      await this.demonstrateNetworkValidationSettings();
      await this.demonstrateRpcHealthMonitoring();
      await this.demonstrateWalletConnection();
      await this.demonstrateNetworkSwitchHandling();
      
      console.log('\n✅ All network validation demos completed');
    } catch (error) {
      console.error('Demo execution failed:', error);
    }
  }
}

// Export for use in other modules
export { NetworkValidationDemo };

// Auto-run demos if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('Network Validation Demo loaded. Use the following to run demos:');
  console.log('const demo = new NetworkValidationDemo();');
  console.log('await demo.runAllDemos();');
  
  // Make available globally for browser testing
  window.NetworkValidationDemo = NetworkValidationDemo;
}