import { renderHook, act } from '@testing-library/react-native';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

const mockSubscribe = jest.fn();
const mockInit = jest.fn();

jest.mock('@/core/network/networkService', () => ({
  networkService: {
    init: (...args: unknown[]) => mockInit(...args),
    subscribe: (listener: (status: string) => void) => {
      mockSubscribe(listener);
      listener('online');
      return jest.fn();
    },
  },
}));

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes network service on mount', () => {
    renderHook(() => useNetworkStatus());
    expect(mockInit).toHaveBeenCalled();
  });

  it('subscribes to network status updates', () => {
    renderHook(() => useNetworkStatus());
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('returns online by default from subscription', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe('online');
  });

  it('updates status when network changes', () => {
    let listener: ((status: string) => void) | undefined;
    mockSubscribe.mockImplementation((cb: (status: string) => void) => {
      listener = cb;
      cb('online');
      return jest.fn();
    });

    const { result } = renderHook(() => useNetworkStatus());
    act(() => {
      listener?.('offline');
    });
    expect(result.current).toBe('offline');
  });
});
