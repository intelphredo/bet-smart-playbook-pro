/**
 * Image optimization utilities.
 * Provides lazy loading, blur placeholder, and responsive sizing helpers.
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook for lazy-loading images with IntersectionObserver.
 * Returns a ref to attach to the image container and whether it's visible.
 */
export function useLazyImage(rootMargin = '200px') {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, isVisible };
}

/**
 * Hook for lazy-loading any below-the-fold content.
 * More aggressive threshold than images.
 */
export function useLazyContent(rootMargin = '100px') {
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

  return { ref, shouldRender };
}

/**
 * Generate srcSet for responsive team logos from ESPN CDN.
 * ESPN supports different sizes via URL params.
 */
export function getResponsiveLogoSrc(url: string, sizes: number[] = [32, 48, 64]) {
  if (!url || !url.includes('espncdn.com')) return { src: url, srcSet: '' };

  const srcSet = sizes
    .map(s => {
      const sized = url.replace(/\/(\d+)\//, `/${s}/`);
      return `${sized} ${s}w`;
    })
    .join(', ');

  return {
    src: url.replace(/\/(\d+)\//, `/${sizes[0]}/`),
    srcSet,
    sizes: `(max-width: 768px) ${sizes[0]}px, ${sizes[1] || sizes[0]}px`,
  };
}

/**
 * Preload critical images (team logos for current matches).
 */
export function preloadImages(urls: string[]) {
  urls.forEach(url => {
    if (!url) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}
