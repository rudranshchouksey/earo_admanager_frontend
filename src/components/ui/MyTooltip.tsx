import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";


export const MyTooltip = ({ infoText}: {infoText: string}) => {
  return (
    <Tooltip>
      <TooltipContent>
        <p className="max-w-[400px] md:max-w-[600px] text-wrap">
          {infoText}
        </p>
      </TooltipContent>
      <TooltipTrigger>
        <InfoIcon className="h-4 w-4" />
      </TooltipTrigger>
    </Tooltip>
  );
};