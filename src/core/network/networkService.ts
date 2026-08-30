import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { logger } from '@/core/logging/logger';

export type NetworkStatus = 'online' | 'offline' | 'reconnecting';

type Listener = (status: NetworkStatus) => void;

class NetworkService {
  private status: NetworkStatus = 'online';
  private listeners = new Set<Listener>();
  private unsubscribe: (() => void) | null = null;
  private wasOffline = false;
  /** Dev/demo override — treats the app as offline regardless of NetInfo. */
  private forcedOffline = false;

  init(): void {
    if (this.unsubscribe) {
      return;
    }
    this.unsubscribe = NetInfo.addEventListener(this.handleChange);
    NetInfo.fetch().then(this.handleChange);
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.listeners.clear();
  }

  setForcedOffline(forced: boolean): void {
    this.forcedOffline = forced;
    if (forced) {
      this.wasOffline = true;
      this.setStatus('offline');
      logger.warn('Forced offline mode enabled');
      return;
    }
    logger.info('Forced offline mode disabled');
    NetInfo.fetch().then(this.handleChange);
  }

  isForcedOffline(): boolean {
    return this.forcedOffline;
  }

  private handleChange = (state: NetInfoState): void => {
    if (this.forcedOffline) {
      this.setStatus('offline');
      return;
    }

    const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
    let next: NetworkStatus;

    if (connected) {
      next = this.wasOffline ? 'reconnecting' : 'online';
      if (this.wasOffline) {
        logger.info('Network reconnected');
        setTimeout(() => {
          if (this.status === 'reconnecting' && !this.forcedOffline) {
            this.setStatus('online');
          }
        }, 1500);
      }
      this.wasOffline = false;
    } else {
      next = 'offline';
      this.wasOffline = true;
      logger.warn('Network offline');
    }

    this.setStatus(next);
  };

  private setStatus(status: NetworkStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.listeners.forEach(listener => listener(status));
  }

  getStatus(): NetworkStatus {
    return this.forcedOffline ? 'offline' : this.status;
  }

  isOnline(): boolean {
    if (this.forcedOffline) {
      return false;
    }
    return this.status === 'online' || this.status === 'reconnecting';
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }
}

export const networkService = new NetworkService();
