import { renderHook, act } from '@testing-library/react-native';
import { useDebouncedValue } from '@/core/utils/debounce';

jest.useFakeTimers();

describe('useDebouncedValue', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('debounces value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 'a', delay: 300 } },
    );

    rerender({ value: 'ab', delay: 300 });
    expect(result.current).toBe('a');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('ab');
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'first' } },
    );

    rerender({ value: 'second' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'third' });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current).toBe('first');

    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('third');
  });
});
