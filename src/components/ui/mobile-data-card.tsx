import * as React from "react";
import { cn } from "@/lib/utils";

interface MobileDataCardsProps<T> {
  data: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function MobileDataCards<T>({
  data,
  renderCard,
  emptyMessage = "No data available",
  className,
}: MobileDataCardsProps<T>) {
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, i) => (
        <React.Fragment key={i}>{renderCard(item, i)}</React.Fragment>
      ))}
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string | number;
}

export function MobileStatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
