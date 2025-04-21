
import { algorithms } from "@/data/mockData";
import AlgorithmCard from "@/components/AlgorithmCard";

const AlgorithmsSection = () => (
  <div className="space-y-4 py-2">
    <h2 className="text-2xl font-bold">Winning Algorithms</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {algorithms.map(algorithm => (
        <AlgorithmCard key={algorithm.name} algorithm={algorithm} />
      ))}
    </div>
  </div>
);

export default AlgorithmsSection;
