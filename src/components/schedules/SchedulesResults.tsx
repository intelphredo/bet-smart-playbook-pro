
import ScheduleTable from "@/components/ScheduleTable";
import ScheduleCard from "@/components/ScheduleCard";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationNext, PaginationPrevious, PaginationItem, PaginationLink } from "@/components/ui/pagination";

interface SchedulesResultsProps {
  isLoading: boolean;
  error: unknown;
  filteredMatches: any[];
  paginatedMatches: any[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  handleRefreshData: () => void;
  filtersVisible: boolean;
  setFiltersVisible: (v: boolean) => void;
}

const ITEMS_PER_PAGE = 10;

const SchedulesResults = ({
  isLoading,
  error,
  filteredMatches,
  paginatedMatches,
  totalPages,
  currentPage,
  setCurrentPage,
  handleRefreshData,
}: SchedulesResultsProps) => {
  if (isLoading)
    return (
      <div className="text-center p-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-navy-500"></div>
        <p className="mt-4">Loading schedules...</p>
      </div>
    );
  if (error)
    return (
      <div className="text-center p-12 text-red-500">
        <p>Error loading schedule data. Please try again later.</p>
        <Button onClick={handleRefreshData} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  if (filteredMatches.length === 0)
    return (
      <div className="text-center p-12 border rounded-lg">
        <p className="text-xl font-medium text-muted-foreground">No scheduled games found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or date range
        </p>
      </div>
    );

  return (
    <>
      <div className="hidden md:block">
        <ScheduleTable matches={paginatedMatches} />
      </div>
      <div className="md:hidden space-y-4">
        {paginatedMatches.map((match) => (
          <ScheduleCard key={match.id} match={match} />
        ))}
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{Math.min(filteredMatches.length, ITEMS_PER_PAGE)}</span> of{" "}
          <span className="font-medium">{filteredMatches.length}</span> games
        </p>
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={currentPage === pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && (
                <>
                  <PaginationItem>
                    <span className="px-2">...</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      isActive={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  );
};

export default SchedulesResults;
