import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef, ICellRendererParams } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDataCards } from '@/components/ui/mobile-data-card';

ModuleRegistry.registerModules([AllCommunityModule]);

interface TeamUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  accounts: string;
  rights: 'admin' | 'edit' | 'view';
  status: 'draft' | 'active' | 'paused' | 'ended';
  invited_at: string | null;
}

const statusColors: Record<string, string> = {
  draft: 'secondary',
  active: 'default',
  paused: 'outline',
  ended: 'destructive',
};

const defaultUser: Omit<TeamUser, 'id'> = {
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  accounts: 'all',
  rights: 'view',
  status: 'draft',
  invited_at: null,
};

export default function UsersTab() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<TeamUser[]>([
    {
      id: '1',
      email: 'sarah@agency.com',
      first_name: 'Sarah',
      last_name: 'Ahmed',
      phone: '+971501234567',
      accounts: 'All Accounts',
      rights: 'admin',
      status: 'active',
      invited_at: '2025-12-01',
    },
    {
      id: '2',
      email: 'james@agency.com',
      first_name: 'James',
      last_name: 'Wilson',
      phone: '+971509876543',
      accounts: 'Acme Corp',
      rights: 'edit',
      status: 'active',
      invited_at: '2026-01-15',
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [form, setForm] = useState<Omit<TeamUser, 'id'>>(defaultUser);

  const openCreate = () => {
    setEditingUser(null);
    setForm(defaultUser);
    setDialogOpen(true);
  };

  const openEdit = (user: TeamUser) => {
    setEditingUser(user);
    setForm({ ...user });
    setDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast({ title: t('account.user_removed') });
  };

  const handleSave = () => {
    if (!form.email || !form.first_name || !form.last_name) {
      toast({ title: t('account.fill_required'), variant: 'destructive' });
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...form } : u))
      );
      toast({ title: t('account.user_updated') });
    } else {
      const newUser: TeamUser = {
        ...form,
        id: crypto.randomUUID(),
        status: 'draft',
        invited_at: null,
      };
      setUsers((prev) => [...prev, newUser]);
      toast({ title: t('account.user_created') });
    }
    setDialogOpen(false);
  };

  const handleSendInvite = () => {
    if (!form.email || !form.first_name || !form.last_name) {
      toast({ title: t('account.fill_required'), variant: 'destructive' });
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...form, status: 'active', invited_at: new Date().toISOString().split('T')[0] }
            : u
        )
      );
    } else {
      const newUser: TeamUser = {
        ...form,
        id: crypto.randomUUID(),
        status: 'active',
        invited_at: new Date().toISOString().split('T')[0],
      };
      setUsers((prev) => [...prev, newUser]);
    }
    toast({ title: t('account.invite_sent'), description: t('account.invite_sent_to', { email: form.email }) });
    setDialogOpen(false);
  };

  const updateForm = (field: keyof Omit<TeamUser, 'id'>, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  const StatusRenderer = useCallback((params: ICellRendererParams) => {
    const status = params.value as string;
    return (
      <Badge variant={statusColors[status] as any} className="capitalize text-xs">
        {status}
      </Badge>
    );
  }, []);

  const RightsRenderer = useCallback((params: ICellRendererParams) => {
    const rights = params.value as string;
    const labels: Record<string, string> = {
      admin: t('account.rights_admin_label'),
      edit: t('account.rights_edit_label'),
      view: t('account.rights_view_label'),
    };
    return <span className="text-sm capitalize">{labels[rights] || rights}</span>;
  }, [t]);

  const ActionsRenderer = useCallback(
    (params: ICellRendererParams) => {
      const user = params.data as TeamUser;
      return (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(user)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(user.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    },
    []
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'first_name', headerName: t('account.first_name'), flex: 1 },
      { field: 'last_name', headerName: t('account.last_name'), flex: 1 },
      { field: 'email', headerName: t('account.email'), flex: 1.5 },
      { field: 'phone', headerName: t('account.phone'), flex: 1 },
      { field: 'accounts', headerName: t('account.advertiser_accounts'), flex: 1 },
      { field: 'rights', headerName: t('account.rights'), flex: 0.8, cellRenderer: RightsRenderer },
      { field: 'status', headerName: t('account.status'), flex: 0.7, cellRenderer: StatusRenderer },
      {
        headerName: '',
        field: 'actions',
        width: 90,
        cellRenderer: ActionsRenderer,
        sortable: false,
        filter: false,
      },
    ],
    [t, StatusRenderer, RightsRenderer, ActionsRenderer]
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('account.team_users')}</CardTitle>
            <CardDescription>{t('account.manage_team')}</CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {t('account.new_user')}
          </Button>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <MobileDataCards
              data={users}
              emptyMessage={t('account.no_team_members')}
              renderCard={(user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{user.first_name} {user.last_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={statusColors[user.status] as any} className="capitalize text-xs">
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {user.rights === 'admin' ? t('account.rights_admin_label') : user.rights === 'edit' ? t('account.rights_edit_label') : t('account.rights_view_label')}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(user)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className="w-full" style={{ height: 360 }}>
              <AgGridReact
                theme={appGridTheme}
                rowData={users}
                columnDefs={columnDefs}
                domLayout="normal"
                rowHeight={44}
                headerHeight={40}
                suppressCellFocus
                animateRows
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUser ? t('account.edit_user') : t('account.create_user')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('account.first_name_required')}</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => updateForm('first_name', e.target.value)}
                  placeholder="Sarah"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('account.last_name_required')}</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => updateForm('last_name', e.target.value)}
                  placeholder="Ahmed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('account.email_required')}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                placeholder="user@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('account.phone_number')}</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder="+971..."
              />
            </div>

            <div className="space-y-2">
              <Label>{t('account.advertiser_accounts')}</Label>
              <Select value={form.accounts} onValueChange={(v) => updateForm('accounts', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('account.all_accounts')}</SelectItem>
                  <SelectItem value="specific">{t('account.specific_accounts')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>{t('account.rights')}</Label>
              <RadioGroup
                value={form.rights}
                onValueChange={(v) => updateForm('rights', v)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="admin" id="rights-admin" />
                  <Label htmlFor="rights-admin" className="font-normal cursor-pointer">
                    {t('account.rights_admin')}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="edit" id="rights-edit" />
                  <Label htmlFor="rights-edit" className="font-normal cursor-pointer">
                    {t('account.rights_edit')}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="view" id="rights-view" />
                  <Label htmlFor="rights-view" className="font-normal cursor-pointer">
                    {t('account.rights_view')}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {editingUser && (
              <div className="space-y-2">
                <Label>{t('account.user_status')}</Label>
                <Select value={form.status} onValueChange={(v) => updateForm('status', v as TeamUser['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('account.status_draft')}</SelectItem>
                    <SelectItem value="active">{t('account.status_active')}</SelectItem>
                    <SelectItem value="paused">{t('account.status_paused')}</SelectItem>
                    <SelectItem value="ended">{t('account.status_ended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleSave}>
              {editingUser ? t('account.save_changes') : t('account.save_draft')}
            </Button>
            <Button onClick={handleSendInvite}>
              <Send className="h-4 w-4 mr-1" />
              {editingUser ? t('account.resend_invite') : t('account.send_invite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
