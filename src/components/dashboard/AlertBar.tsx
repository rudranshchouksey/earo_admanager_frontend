import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, systemApi } from '@/services/system';
import { auth } from '@/services/api';
import { userApi } from '@/services/user';
import { toast } from '@/hooks/use-toast';
import { organizationApi } from '@/services/organization';
import { useNavigate } from 'react-router-dom';

interface Alert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  cta_label: string | null;
  cta_url: string | null;
  cta_action?: () => Promise<void>;
  userId: string;
}

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
  const navigate = useNavigate();
  useEffect(() => {

    const load = async () => {
      const {
        data: { session: initialSession },
      } = await auth.getSession();
      if (!initialSession) return;

      const {
        data: userProfile,
        status,
        message,
      } = await userApi.getUserProfile();


      if (status !== 200) {
        toast({
          title: "Error",
          description: message || "Failed to load user profile",
          variant: "destructive",
        });
        return;
      }

      console.log({ userProfile });
      console.log({ session: initialSession });
      const allAlerts = [];


      if(!userProfile.data.isVerified){
        const hasCancelledVerifyEmail = localStorage.getItem('verify-email-'+userProfile.data.id);
        if(!hasCancelledVerifyEmail){
          allAlerts.push(
            {
              id: "verify-email",
              title: "Verify Email",
              message: "Please verify your email to continue",
              alert_type: "error",
              cta_label: "Verify Email",
              cta_url: "/dashboard/verify-email",
              cta_action: async () => {
                const {data, error, status, message} = await auth.resendOtp(userProfile.data.email);
                if(error || status !== 200){
                  toast({
                    title: "Error",
                    description: message || "Failed to send email verification",
                    variant: "destructive",
                  });
                }
                else {
                  toast({
                    title: "Email Verification Sent",
                    description: "Please check your email for the verification code",
                    variant: "default",
                  });
                }
                localStorage.setItem('hasCancelledVerifyEmail'+userProfile.data.id, 'true');
                setAlerts((prev) => prev.filter((a) => a.id !== "verify-email"));
              },
              userId: userProfile.data.id,
            });
        }
      }



      const hasCancelledCompleteProfile = localStorage.getItem('complete-profile-'+userProfile.data.id);

      console.log({ hasCancelledCompleteProfile });

      if (hasCancelledCompleteProfile) {
        setAlerts(allAlerts);
        return;
      }



      const organizationId = initialSession?.currentOrganizationId;

      const {
        data: organizationDetails,
        status: organizationDetailsStatus,
        message: organizationDetailsMessage,
      } = await organizationApi.getOrganizationDetails(organizationId);
      console.log({ organizationDetails });

      if (organizationDetailsStatus !== 200) {
        toast({
          title: "Error",
          description: organizationDetailsMessage || "Failed to load organization details",
          variant: "destructive",
        });
        return;
      }


      console.log({firstName: userProfile.data.firstName, orgName: organizationDetails.data.organization.orgName});

      if(!userProfile.data.firstName || !organizationDetails.data.organization.orgName){
        allAlerts.push(
          {
            id: "complete-profile",
            title: "Complete Profile",
            message: "Please complete your profile and company details",
            alert_type: "error",
            cta_label: "Complete Profile",
            cta_url: "/dashboard/account",
            userId: userProfile.data.id,
          }
        );
      }
      setAlerts(allAlerts);

    };
    load();
  }, []);

  const dismiss = async (alert: Alert) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    //await systemApi.dismissAlert(id);
    localStorage.setItem(alert.id + '-' + alert.userId, 'true');
  };

  console.log({ alerts });

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
                onClick={() => alert.cta_action ? alert.cta_action() : navigate(alert.cta_url!)}
              >
                {alert.cta_label}
              </Button>
            )}
            <button onClick={() => dismiss(alert)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
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
