import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '@/app/navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToAuth(): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Auth');
  }
}
