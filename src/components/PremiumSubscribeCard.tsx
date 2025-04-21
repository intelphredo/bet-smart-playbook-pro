
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PremiumSubscribeCard = () => (
  <Card className="bg-navy-500 text-white border-0">
    <CardContent className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold mb-2">
            Get Premium Picks & Analyses
          </h3>
          <p className="text-navy-100 mb-4 md:mb-0">
            Subscribe to unlock our best algorithms and expert picks.
          </p>
        </div>
        <Button className="bg-gold-500 hover:bg-gold-600 text-navy-900">
          Subscribe Now
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default PremiumSubscribeCard;
