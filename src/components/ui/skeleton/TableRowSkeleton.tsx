import { Skeleton } from '@/components/ui/skeleton';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface TableRowSkeletonProps {
  columns: number;
  rows?: number;
  className?: string;
  gold?: boolean;
  /** Column width patterns: 'auto' | 'sm' | 'md' | 'lg' | 'xl' */
  columnWidths?: Array<'auto' | 'sm' | 'md' | 'lg' | 'xl'>;
}

const widthClasses = {
  auto: 'w-full',
  sm: 'w-12',
  md: 'w-20',
  lg: 'w-32',
  xl: 'w-48',
};

/**
 * Skeleton loading state for table rows
 * Provides consistent loading UI for data tables
 */
export function TableRowSkeleton({ 
  columns, 
  rows = 5, 
  className,
  gold = false,
  columnWidths = []
}: TableRowSkeletonProps) {
  const skeletonRows = Array.from({ length: rows }, (_, i) => i);
  const skeletonCols = Array.from({ length: columns }, (_, i) => i);
  
  return (
    <>
      {skeletonRows.map((rowIndex) => (
        <TableRow key={rowIndex} className={cn("animate-pulse", className)}>
          {skeletonCols.map((colIndex) => {
            const widthKey = columnWidths[colIndex] || 'auto';
            return (
              <TableCell key={colIndex}>
                <Skeleton 
                  className={cn("h-4", widthClasses[widthKey])}
                  gold={gold}
                />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

/**
 * Full table skeleton with header
 */
interface FullTableSkeletonProps {
  columns: number;
  rows?: number;
  className?: string;
  gold?: boolean;
  showHeader?: boolean;
}

export function FullTableSkeleton({
  columns,
  rows = 5,
  className,
  gold = false,
  showHeader = true
}: FullTableSkeletonProps) {
  const skeletonRows = Array.from({ length: rows }, (_, i) => i);
  const skeletonCols = Array.from({ length: columns }, (_, i) => i);
  
  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-border", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
          {skeletonCols.map((i) => (
            <Skeleton 
              key={i} 
              className={cn("h-4", i === 0 ? "w-32" : "w-20")}
              gold={gold}
            />
          ))}
        </div>
      )}
      
      {/* Rows */}
      <div className="divide-y divide-border">
        {skeletonRows.map((rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 p-4">
            {skeletonCols.map((colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={cn("h-4", colIndex === 0 ? "w-32" : "w-20")}
                gold={gold}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableRowSkeleton;
