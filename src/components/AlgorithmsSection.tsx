
import { algorithms } from "@/data/mockData";
import AlgorithmCard from "@/components/AlgorithmCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

const AlgorithmsSection = () => (
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
      {algorithms.map(algorithm => (
        <AlgorithmCard key={algorithm.name} algorithm={algorithm} />
      ))}
    </div>
  </div>
);

export default AlgorithmsSection;
