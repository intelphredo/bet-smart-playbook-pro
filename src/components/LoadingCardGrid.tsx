
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  count?: number;
}

const LoadingCardGrid = ({ count = 3 }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-12 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-500" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default LoadingCardGrid;
