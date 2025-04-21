
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";

interface ScheduleFiltersProps {
  onClose: () => void;
  onApply: () => void;
}

const ScheduleFilters = ({ onClose, onApply }: ScheduleFiltersProps) => {
  const [showOnlyTelevised, setShowOnlyTelevised] = useState(false);
  const [showOnlyHomeCourt, setShowOnlyHomeCourt] = useState(false);
  const [includePastGames, setIncludePastGames] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Advanced Filters</h3>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="televised" 
            checked={showOnlyTelevised}
            onCheckedChange={(checked) => setShowOnlyTelevised(!!checked)}
          />
          <label htmlFor="televised" className="text-sm font-medium leading-none cursor-pointer">
            Show only nationally televised games
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="homeCourt" 
            checked={showOnlyHomeCourt}
            onCheckedChange={(checked) => setShowOnlyHomeCourt(!!checked)}
          />
          <label htmlFor="homeCourt" className="text-sm font-medium leading-none cursor-pointer">
            Show only home court/field games
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="pastGames" 
            checked={includePastGames}
            onCheckedChange={(checked) => setIncludePastGames(!!checked)}
          />
          <label htmlFor="pastGames" className="text-sm font-medium leading-none cursor-pointer">
            Include past games
          </label>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default ScheduleFilters;
