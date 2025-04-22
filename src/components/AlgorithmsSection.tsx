
import { Button } from "@/components/ui/button";
import AlgorithmCard from "@/components/AlgorithmCard";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { useAlgorithmPerformance } from "@/hooks/useAlgorithmPerformance";
import { Skeleton } from "@/components/ui/skeleton";

const AlgorithmsSection = () => {
  const { data: algorithms, isLoading, error } = useAlgorithmPerformance();

  if (error) {
    return (
      <div className="space-y-4 py-2">
        <div className="text-red-500">Error loading algorithm data</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Winning Algorithms</h2>
        <Link to="/schedules">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>View Full Schedules</span>
          </Button>
        </Link>
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
