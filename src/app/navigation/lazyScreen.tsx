import React, { Suspense, type ComponentType } from 'react';
import { Loader } from '@/design-system/components';

export function lazyScreen<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
): React.ComponentType<P> {
  const LazyComponent = React.lazy(factory);

  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={<Loader message="Loading screen..." />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
