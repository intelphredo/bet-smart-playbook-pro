
import { Crown } from "lucide-react";

const PremiumSectionHeader = () => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Crown className="h-6 w-6 text-gold-500" />
      <h2 className="text-xl font-bold">Premium Features</h2>
    </div>
  );
};

export default PremiumSectionHeader;
