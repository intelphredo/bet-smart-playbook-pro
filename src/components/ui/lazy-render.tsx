/**
 * Lazy-render wrapper for below-the-fold content.
 * Uses IntersectionObserver to only render children when they scroll into view.
 */

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyRenderProps {
  children: ReactNode;
  /** Height of the placeholder before content loads */
  height?: string;
  /** IntersectionObserver root margin (load before visible) */
  rootMargin?: string;
  /** Optional custom placeholder */
  placeholder?: ReactNode;
  /** CSS class for the wrapper */
  className?: string;
}

export function LazyRender({
  children,
  height = '200px',
  rootMargin = '200px',
  placeholder,
  className,
}: LazyRenderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin]);

  if (shouldRender) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className} style={{ minHeight: height }}>
      {placeholder || (
        <div className="space-y-3 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[120px] w-full rounded" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}
    </div>
  );
}
