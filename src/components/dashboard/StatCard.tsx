import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
}

export default function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="bg-card">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
      </CardContent>
    </Card>
  );
}
