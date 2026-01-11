import { useRef, ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimatedItemHeight?: number;
  className?: string;
  containerClassName?: string;
  overscan?: number;
  maxHeight?: number | string;
}

export default function VirtualizedList<T>({
  items,
  renderItem,
  estimatedItemHeight = 60,
  className,
  containerClassName,
  overscan = 3,
  maxHeight = 400,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
  });

  // For small lists, don't virtualize
  if (items.length <= 10) {
    return (
      <div className={cn("space-y-1", className)}>
        {items.map((item, index) => (
          <div key={index}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto", containerClassName)}
      style={{ 
        maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
        contain: "strict" 
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            className={className}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
