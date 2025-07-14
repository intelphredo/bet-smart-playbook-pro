
import { Button } from "@/components/ui/button";
import AlgorithmCard from "@/components/AlgorithmCard";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { useAlgorithmPerformance } from "@/hooks/useAlgorithmPerformance";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DateRangeFilter from "./DateRangeFilter";

const AlgorithmsSection = () => {
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const { data: algorithms, isLoading, error, refetch } = useAlgorithmPerformance({
    dateRange,
  });

  // Set up real-time subscription for algorithm predictions
  useEffect(() => {
    const channel = supabase
      .channel('algorithm-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'algorithm_predictions'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const resetDateFilter = () => {
    setDateRange({});
  };

  if (error) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Winning Algorithms</h2>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <span className="text-sm font-medium">Unable to load algorithm data</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Please check your connection and try again.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Winning Algorithms</h2>
        <div className="flex items-center gap-4">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={resetDateFilter}
          />
          <Link to="/schedules">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>View Full Schedules</span>
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))
        ) : algorithms?.map(algorithm => (
          <AlgorithmCard key={algorithm.name} algorithm={algorithm} />
        ))}
      </div>
    </div>
  );
};

export default AlgorithmsSection;
