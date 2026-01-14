import { MatchCardSkeleton } from "@/components/ui/loading-skeleton";

interface Props {
  count?: number;
  variant?: "card" | "match";
}

const LoadingCardGrid = ({ count = 3, variant = "match" }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <MatchCardSkeleton key={i} />
    ))}
  </div>
);

export default LoadingCardGrid;
