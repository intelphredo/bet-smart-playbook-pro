import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  fallbackClassName?: string;
}

const ImageFallback = React.forwardRef<HTMLImageElement, ImageFallbackProps>(
  ({ fallback, fallbackClassName, className, alt, ...props }, ref) => {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    const handleLoad = () => {
      setIsLoading(false);
    };

    if (hasError) {
      return (
        <div className={cn("flex items-center justify-center bg-muted", fallbackClassName)}>
          {fallback || (
            <span className="text-xs font-medium text-muted-foreground">
              {alt?.substring(0, 2).toUpperCase() || '?'}
            </span>
          )}
        </div>
      );
    }

    return (
      <>
        {isLoading && (
          <div className={cn("animate-pulse bg-muted", className)} />
        )}
        <img
          ref={ref}
          className={cn(className, isLoading && "hidden")}
          onError={handleError}
          onLoad={handleLoad}
          alt={alt}
          {...props}
        />
      </>
    );
  }
);

ImageFallback.displayName = "ImageFallback";

export { ImageFallback };