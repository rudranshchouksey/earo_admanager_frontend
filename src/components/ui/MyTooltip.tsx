import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { cn } from "@/lib/utils";


export const MyTooltip = ({ infoText, html, className, iconClassName}: {infoText?: string, html?: string, className?: string, iconClassName?: string}) => {
  return (
    <Tooltip>
      <TooltipContent className="max-w-[400px] md:max-w-[600px] text-wrap max-h-[400px] overflow-y-auto">
        {
          infoText  && <p>{infoText}</p>
        }

        { html && <div dangerouslySetInnerHTML={{ __html: html }}></div> }
      </TooltipContent>
      <TooltipTrigger>
        <InfoIcon className={cn("h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors", iconClassName)} />
      </TooltipTrigger>
    </Tooltip>
  );
};