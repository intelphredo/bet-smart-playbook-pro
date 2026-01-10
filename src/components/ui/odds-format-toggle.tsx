import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useOddsFormat, OddsFormat } from "@/contexts/OddsFormatContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OddsFormatToggleProps {
  className?: string;
}

export function OddsFormatToggle({ className }: OddsFormatToggleProps) {
  const { format, setFormat } = useOddsFormat();

  return (
    <TooltipProvider>
      <ToggleGroup 
        type="single" 
        value={format} 
        onValueChange={(value) => value && setFormat(value as OddsFormat)}
        className={className}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="american" 
              size="sm"
              className="text-xs px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              US
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>American odds (+150, -110)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="decimal" 
              size="sm"
              className="text-xs px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              DEC
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Decimal odds (2.50, 1.91)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem 
              value="fractional" 
              size="sm"
              className="text-xs px-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              FRAC
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>
            <p>Fractional odds (3/2, 10/11)</p>
          </TooltipContent>
        </Tooltip>
      </ToggleGroup>
    </TooltipProvider>
  );
}
