import { useRef, ReactNode, memo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render: (item: T, index: number) => ReactNode;
  className?: string;
}

interface VirtualizedTableProps<T> {
  items: T[];
  columns: Column<T>[];
  estimatedRowHeight?: number;
  maxHeight?: number | string;
  className?: string;
  getRowKey: (item: T, index: number) => string;
  overscan?: number;
  emptyMessage?: string;
}

// Memoized row component
const VirtualizedTableRow = memo(function VirtualizedTableRow<T>({
  item,
  index,
  columns,
  style,
}: {
  item: T;
  index: number;
  columns: Column<T>[];
  style: React.CSSProperties;
}) {
  return (
    <div 
      className="flex items-center border-b border-border/50 hover:bg-muted/50 transition-colors"
      style={style}
    >
      {columns.map((col) => (
        <div
          key={col.key}
          className={cn(
            "px-4 py-3 text-sm flex-shrink-0",
            col.className
          )}
          style={{ width: col.width || "auto", flex: col.width ? "0 0 auto" : 1 }}
        >
          {col.render(item, index)}
        </div>
      ))}
    </div>
  );
}) as <T>(props: {
  item: T;
  index: number;
  columns: Column<T>[];
  style: React.CSSProperties;
}) => JSX.Element;

export default function VirtualizedTable<T>({
  items,
  columns,
  estimatedRowHeight = 52,
  maxHeight = 600,
  className,
  getRowKey,
  overscan = 5,
  emptyMessage = "No data available",
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  });

  // Calculate total width for the header
  const headerStyle = {
    display: "flex",
    width: "100%",
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // For small lists (<=15), render without virtualization
  if (items.length <= 15) {
    return (
      <div className={cn("overflow-x-auto", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead 
                  key={col.key} 
                  className={col.className}
                  style={{ width: col.width }}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={getRowKey(item, index)} className="hover:bg-muted/50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3 text-sm", col.className)}
                    style={{ width: col.width }}
                  >
                    {col.render(item, index)}
                  </td>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Fixed Header */}
      <div 
        className="bg-muted/50 border-b font-medium text-muted-foreground text-sm"
        style={headerStyle}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className={cn("px-4 py-3 flex-shrink-0", col.className)}
            style={{ width: col.width || "auto", flex: col.width ? "0 0 auto" : 1 }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtualized Body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{
          maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          contain: "strict",
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            return (
              <VirtualizedTableRow
                key={getRowKey(item, virtualRow.index)}
                item={item}
                index={virtualRow.index}
                columns={columns}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Export Column type for use in other components
export type { Column };
