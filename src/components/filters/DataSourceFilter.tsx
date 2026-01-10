import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, Wifi, DollarSign, Layers } from "lucide-react";

export type DataViewSource = "combined" | "espn" | "odds";

interface DataSourceFilterProps {
  value: DataViewSource;
  onChange: (value: DataViewSource) => void;
}

const DataSourceFilter = ({ value, onChange }: DataSourceFilterProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as DataViewSource)}>
      <SelectTrigger className="w-[160px] h-9 bg-background border-border/50">
        <SelectValue placeholder="Data Source" />
      </SelectTrigger>
      <SelectContent className="bg-popover border-border z-50">
        <SelectItem value="combined" className="cursor-pointer">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <span>Combined</span>
          </div>
        </SelectItem>
        <SelectItem value="espn" className="cursor-pointer">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <span>ESPN Only</span>
          </div>
        </SelectItem>
        <SelectItem value="odds" className="cursor-pointer">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-500" />
            <span>Odds API Only</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default DataSourceFilter;
