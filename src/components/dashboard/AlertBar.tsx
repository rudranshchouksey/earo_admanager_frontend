import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, systemApi } from '@/services/system';


const iconMap: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colorMap: Record<string, { bg: string; border: string; text: string }> = {
  info: { bg: 'bg-primary/5', border: 'border-primary/15', text: 'text-primary' },
  warning: { bg: 'bg-yellow-500/5', border: 'border-yellow-500/15', text: 'text-yellow-700' },
  error: { bg: 'bg-destructive/5', border: 'border-destructive/15', text: 'text-destructive' },
};

export default function AlertBar() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [expanded, setExpanded] = useState(false);

  // useEffect(() => {
  //   const fetchAlerts = async () => {
  //     const { data } = await systemApi.getSystemAlerts();
  //     if (data) setAlerts(data);
  //   };
  //   fetchAlerts();
  // }, []);

  const dismiss = async (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await systemApi.dismissAlert(id);
  };

  if (alerts.length === 0) return null;

  const visibleAlerts = expanded ? alerts : alerts.slice(0, 2);
  const hiddenCount = alerts.length - 2;

  return (
    <div className="border-b border-border bg-background">
      {visibleAlerts.map((alert) => {
        const Icon = iconMap[alert.alert_type] || Info;
        const colors = colorMap[alert.alert_type] || colorMap.info;
        return (
          <div
            key={alert.id}
            className={`flex items-center gap-3 px-4 lg:px-6 py-2.5 border-b last:border-b-0 ${colors.border} ${colors.bg}`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${colors.text}`} />
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className={`text-sm font-medium ${colors.text}`}>{alert.title}</span>
              <span className="text-sm text-muted-foreground truncate">{alert.message}</span>
            </div>
            {alert.cta_label && alert.cta_url && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => window.open(alert.cta_url!, '_blank')}
              >
                {alert.cta_label}
              </Button>
            )}
            <button onClick={() => dismiss(alert.id)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className="h-3 w-3" />
          Show {hiddenCount} more
        </button>
      )}
    </div>
  );
}
