
import { LoadingCard } from "@/components/ui/loading-card";

interface Props {
  count?: number;
}

const LoadingCardGrid = ({ count = 3 }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <LoadingCard key={i} />
    ))}
  </div>
);

export default LoadingCardGrid;
