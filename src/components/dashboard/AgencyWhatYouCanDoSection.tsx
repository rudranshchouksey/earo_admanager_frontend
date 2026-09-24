import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AgencyWhatYouCanDoSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground px-1">
        What you can do
      </p>
      <div className="grid grid-cols-1 gap-4">
        <Card className="rounded-[24px] border border-border bg-card">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Advertisers</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each client gets their own workspace with separate campaigns, budgets and reports. Manage all of them
              from one agency login.
            </p>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => navigate('/dashboard/account?page=advertisers')}
            >
              Add first advertiser
            </button>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border bg-card">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Team</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Invite colleagues and assign them to specific advertisers. Fine-grained permissions so each person
              only sees what they need to.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Add an advertiser to unlock
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border border-border bg-card">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Campaigns</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Create and manage campaigns on behalf of any advertiser. Cross-advertiser reporting shows you
              performance in one view.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Add an advertiser to unlock
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
