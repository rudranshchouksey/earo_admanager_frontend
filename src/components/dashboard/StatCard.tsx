import { Loader2, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  loading?: boolean;
}

export default function StatCard({ label, value, icon: Icon, loading }: StatCardProps) {
  return (
    <Card className="bg-card rounded-lg">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
        {
          loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <p className="text-xl font-semibold text-foreground">{value}</p>
          )
        }
      </CardContent>
    </Card>
  );
}
