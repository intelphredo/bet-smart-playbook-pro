import { Card, CardContent, CardHeader } from "@/components/ui/card";

const LoadingCard = () => {
  return (
    <Card className="skeleton-card-premium overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <div className="skeleton-line h-6 w-20" />
          <div className="skeleton-line h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-3 gap-4 items-center mb-6">
          <div className="text-center">
            <div className="skeleton-circle w-12 h-12 mx-auto mb-2" />
            <div className="skeleton-line h-4 w-12 mx-auto mb-1" />
            <div className="skeleton-line h-3 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <div className="skeleton-line h-6 w-8 mx-auto" />
          </div>
          <div className="text-center">
            <div className="skeleton-circle w-12 h-12 mx-auto mb-2" />
            <div className="skeleton-line h-4 w-12 mx-auto mb-1" />
            <div className="skeleton-line h-3 w-16 mx-auto" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="skeleton-line h-8 w-full" />
          <div className="skeleton-line h-6 w-3/4" />
          <div className="flex gap-2">
            <div className="skeleton-line h-6 w-20" />
            <div className="skeleton-line h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { LoadingCard };