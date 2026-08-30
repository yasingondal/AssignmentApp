import { useEffect, useState } from 'react';
import { networkService } from '@/core/network/networkService';
import type { NetworkStatus } from '@/core/network/networkService';

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>('online');

  useEffect(() => {
    networkService.init();
    return networkService.subscribe(setStatus);
  }, []);

  return status;
}
