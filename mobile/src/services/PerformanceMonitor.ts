/**
 * Performance Monitoring Service
 * Monitors app performance, battery usage, memory consumption, and loading times
 */

import {Platform, DeviceEventEmitter, NativeModules, AppState} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PerformanceMetrics} from '@/types';

interface PerformanceEvent {
  type: string;
  timestamp: number;
  data: any;
}

interface MemoryInfo {
  totalMemory: number;
  availableMemory: number;
  usedMemory: number;
  jsHeapSizeLimit?: number;
  jsHeapSizeUsed?: number;
}

interface BatteryInfo {
  level: number;
  isCharging: boolean;
}

class PerformanceMonitorClass {
  private isMonitoring = false;
  private startTime: number = 0;
  private metrics: PerformanceMetrics;
  private performanceEvents: PerformanceEvent[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private memoryWarningListener: any = null;
  private appStateListener: any = null;

  constructor() {
    this.metrics = {
      appStartTime: 0,
      memoryUsage: 0,
      batteryLevel: 100,
      networkLatency: 0,
      renderTime: 0,
      crashCount: 0,
    };
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    try {
      this.startTime = Date.now();
      this.isMonitoring = true;

      // Load previous crash count
      await this.loadCrashCount();

      // Setup event listeners
      this.setupEventListeners();

      // Start periodic monitoring
      this.startPeriodicMonitoring();

      // Collect initial metrics
      await this.collectInitialMetrics();

      console.log('Performance monitoring started');
    } catch (error) {
      console.error('Failed to start performance monitoring:', error);
    }
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Remove event listeners
    this.removeEventListeners();

    console.log('Performance monitoring stopped');
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    try {
      const [memoryInfo, batteryInfo, networkLatency] = await Promise.all([
        this.getMemoryInfo(),
        this.getBatteryInfo(),
        this.measureNetworkLatency(),
      ]);

      this.metrics = {
        appStartTime: this.startTime,
        memoryUsage: memoryInfo.usedMemory,
        batteryLevel: batteryInfo.level,
        networkLatency,
        renderTime: this.getAverageRenderTime(),
        crashCount: await this.getCrashCount(),
      };

      // Store metrics for historical tracking
      await this.storeMetrics(this.metrics);

      return this.metrics;
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      return this.metrics;
    }
  }

  /**
   * Get memory information
   */
  private async getMemoryInfo(): Promise<MemoryInfo> {
    try {
      const totalMemory = await DeviceInfo.getTotalMemory();
      const usedMemory = await DeviceInfo.getUsedMemory();
      const availableMemory = totalMemory - usedMemory;

      let jsHeapInfo = {};
      if (global.performance && global.performance.memory) {
        jsHeapInfo = {
          jsHeapSizeLimit: global.performance.memory.jsHeapSizeLimit,
          jsHeapSizeUsed: global.performance.memory.usedJSHeapSize,
        };
      }

      return {
        totalMemory: totalMemory / 1024 / 1024, // Convert to MB
        availableMemory: availableMemory / 1024 / 1024,
        usedMemory: usedMemory / 1024 / 1024,
        ...jsHeapInfo,
      };
    } catch (error) {
      console.error('Failed to get memory info:', error);
      return {
        totalMemory: 0,
        availableMemory: 0,
        usedMemory: 0,
      };
    }
  }

  /**
   * Get battery information
   */
  private async getBatteryInfo(): Promise<BatteryInfo> {
    try {
      const [batteryLevel, isCharging] = await Promise.all([
        DeviceInfo.getBatteryLevel(),
        DeviceInfo.isBatteryCharging(),
      ]);

      return {
        level: Math.round(batteryLevel * 100),
        isCharging,
      };
    } catch (error) {
      console.error('Failed to get battery info:', error);
      return {
        level: 100,
        isCharging: false,
      };
    }
  }

  /**
   * Measure network latency
   */
  private async measureNetworkLatency(): Promise<number> {
    try {
      const startTime = Date.now();
      
      await fetch(`${process.env.API_BASE_URL || 'https://api.mlg.clan'}/health`, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      return Date.now() - startTime;
    } catch (error) {
      console.error('Failed to measure network latency:', error);
      return 0;
    }
  }

  /**
   * Setup event listeners for performance monitoring
   */
  private setupEventListeners(): void {
    // Memory warning listener (iOS)
    if (Platform.OS === 'ios') {
      this.memoryWarningListener = DeviceEventEmitter.addListener(
        'memoryWarning',
        this.handleMemoryWarning.bind(this)
      );
    }

    // App state listener
    this.appStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );

    // JS error handler
    const originalHandler = global.ErrorUtils?.getGlobalHandler();
    global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
      this.recordCrash(error, isFatal);
      
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (this.memoryWarningListener) {
      this.memoryWarningListener.remove();
      this.memoryWarningListener = null;
    }

    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }

  /**
   * Start periodic monitoring
   */
  private startPeriodicMonitoring(): void {
    this.intervalId = setInterval(async () => {
      if (!this.isMonitoring) {
        return;
      }

      try {
        await this.collectMetrics();
        this.checkPerformanceThresholds();
      } catch (error) {
        console.error('Periodic monitoring error:', error);
      }
    }, 30000); // Collect metrics every 30 seconds
  }

  /**
   * Collect initial metrics
   */
  private async collectInitialMetrics(): Promise<void> {
    await this.collectMetrics();
  }

  /**
   * Handle memory warning
   */
  private handleMemoryWarning(): void {
    console.warn('Memory warning received');
    
    this.recordEvent('memory_warning', {
      timestamp: Date.now(),
      memoryUsage: this.metrics.memoryUsage,
    });

    // Trigger garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: string): void {
    this.recordEvent('app_state_change', {
      state: nextAppState,
      timestamp: Date.now(),
    });

    if (nextAppState === 'background') {
      // App went to background - reduce monitoring frequency
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = setInterval(async () => {
          await this.collectMetrics();
        }, 60000); // Collect metrics every minute in background
      }
    } else if (nextAppState === 'active') {
      // App became active - resume normal monitoring
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.startPeriodicMonitoring();
      }
    }
  }

  /**
   * Record performance event
   */
  recordEvent(type: string, data: any): void {
    const event: PerformanceEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    this.performanceEvents.push(event);

    // Keep only last 100 events
    if (this.performanceEvents.length > 100) {
      this.performanceEvents.shift();
    }
  }

  /**
   * Record render time
   */
  recordRenderTime(componentName: string, renderTime: number): void {
    this.recordEvent('render_time', {
      component: componentName,
      renderTime,
    });
  }

  /**
   * Record crash
   */
  private recordCrash(error: Error, isFatal: boolean): void {
    this.recordEvent('crash', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      isFatal,
    });

    // Increment crash count
    this.incrementCrashCount();
  }

  /**
   * Get average render time
   */
  private getAverageRenderTime(): number {
    const renderEvents = this.performanceEvents.filter(e => e.type === 'render_time');
    
    if (renderEvents.length === 0) {
      return 0;
    }

    const totalTime = renderEvents.reduce((sum, event) => sum + event.data.renderTime, 0);
    return totalTime / renderEvents.length;
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(): void {
    const alerts: string[] = [];

    // Memory usage threshold (80% of available memory)
    if (this.metrics.memoryUsage > 80) {
      alerts.push('High memory usage detected');
    }

    // Battery level threshold (below 20%)
    if (this.metrics.batteryLevel < 20) {
      alerts.push('Low battery detected');
    }

    // Network latency threshold (above 2 seconds)
    if (this.metrics.networkLatency > 2000) {
      alerts.push('High network latency detected');
    }

    // Render time threshold (above 16ms for 60fps)
    if (this.metrics.renderTime > 16) {
      alerts.push('Slow rendering detected');
    }

    if (alerts.length > 0) {
      this.recordEvent('performance_alert', {
        alerts,
        metrics: this.metrics,
      });
    }
  }

  /**
   * Load crash count from storage
   */
  private async loadCrashCount(): Promise<void> {
    try {
      const count = await AsyncStorage.getItem('crash_count');
      this.metrics.crashCount = count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Failed to load crash count:', error);
      this.metrics.crashCount = 0;
    }
  }

  /**
   * Increment crash count
   */
  private async incrementCrashCount(): Promise<void> {
    try {
      this.metrics.crashCount += 1;
      await AsyncStorage.setItem('crash_count', this.metrics.crashCount.toString());
    } catch (error) {
      console.error('Failed to increment crash count:', error);
    }
  }

  /**
   * Get crash count
   */
  private async getCrashCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem('crash_count');
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Store metrics for historical tracking
   */
  private async storeMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      const key = `metrics_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(metrics));

      // Clean up old metrics (keep last 24 hours)
      await this.cleanupOldMetrics();
    } catch (error) {
      console.error('Failed to store metrics:', error);
    }
  }

  /**
   * Clean up old metrics
   */
  private async cleanupOldMetrics(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metricsKeys = keys.filter(key => key.startsWith('metrics_'));
      
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      const keysToDelete = metricsKeys.filter(key => {
        const timestamp = parseInt(key.split('_')[1], 10);
        return timestamp < cutoffTime;
      });

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error);
    }
  }

  /**
   * Get historical metrics
   */
  async getHistoricalMetrics(): Promise<PerformanceMetrics[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const metricsKeys = keys.filter(key => key.startsWith('metrics_'));
      
      const metricsData = await AsyncStorage.multiGet(metricsKeys);
      
      return metricsData
        .map(([key, value]) => {
          try {
            return JSON.parse(value!);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.appStartTime - a.appStartTime);
    } catch (error) {
      console.error('Failed to get historical metrics:', error);
      return [];
    }
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(): Promise<{
    current: PerformanceMetrics;
    historical: PerformanceMetrics[];
    events: PerformanceEvent[];
    recommendations: string[];
  }> {
    const historical = await this.getHistoricalMetrics();
    const recommendations = this.generateRecommendations();

    return {
      current: this.metrics,
      historical,
      events: [...this.performanceEvents],
      recommendations,
    };
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.memoryUsage > 70) {
      recommendations.push('Consider reducing memory usage by optimizing images and clearing caches');
    }

    if (this.metrics.batteryLevel < 30) {
      recommendations.push('Enable power saving mode to extend battery life');
    }

    if (this.metrics.networkLatency > 1000) {
      recommendations.push('Check network connection for optimal performance');
    }

    if (this.metrics.renderTime > 16) {
      recommendations.push('Optimize component rendering to improve frame rate');
    }

    if (this.metrics.crashCount > 0) {
      recommendations.push('Recent crashes detected - consider updating the app');
    }

    return recommendations;
  }

  /**
   * Export performance data for debugging
   */
  async exportPerformanceData(): Promise<string> {
    try {
      const report = await this.getPerformanceReport();
      const deviceInfo = {
        model: await DeviceInfo.getModel(),
        brand: await DeviceInfo.getBrand(),
        systemVersion: await DeviceInfo.getSystemVersion(),
        appVersion: await DeviceInfo.getVersion(),
        buildNumber: await DeviceInfo.getBuildNumber(),
      };

      const exportData = {
        deviceInfo,
        report,
        exportTimestamp: Date.now(),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export performance data:', error);
      return '';
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Is monitoring active
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

export const PerformanceMonitor = new PerformanceMonitorClass();