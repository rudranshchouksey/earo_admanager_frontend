import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef, ICellRendererParams } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, PauseCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDataCards } from '@/components/ui/mobile-data-card';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Advertiser {
  id: string;
  name: string;
  external_id: string;
  industry: string;
  status: 'active' | 'paused' | 'ended';
}

const INDUSTRIES = [
  'Retail', 'Food & Beverage', 'Technology', 'Healthcare', 'Education',
  'Real Estate', 'Automotive', 'Fashion', 'Finance', 'Travel', 'Entertainment', 'Telecom', 'Other',
];

const statusColors: Record<string, string> = {
  active: 'default',
  paused: 'outline',
  ended: 'destructive',
};

const MOCK_ADVERTISERS: Advertiser[] = [
  { id: '1', name: 'Careem', external_id: 'ADV-10231', industry: 'Technology', status: 'active' },
  { id: '2', name: 'Noon', external_id: 'ADV-10232', industry: 'Retail', status: 'active' },
  { id: '3', name: 'Emirates NBD', external_id: 'ADV-10233', industry: 'Finance', status: 'active' },
  { id: '4', name: 'Talabat', external_id: 'ADV-10234', industry: 'Food & Beverage', status: 'paused' },
  { id: '5', name: 'Kitopi', external_id: 'ADV-10235', industry: 'Food & Beverage', status: 'ended' },
];

const defaultForm: Omit<Advertiser, 'id'> = {
  name: '',
  external_id: '',
  industry: '',
  status: 'active',
};

export default function AdvertisersTab() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>(MOCK_ADVERTISERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Advertiser | null>(null);
  const [form, setForm] = useState<Omit<Advertiser, 'id'>>(defaultForm);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (adv: Advertiser) => {
    setEditing(adv);
    setForm({ name: adv.name, external_id: adv.external_id, industry: adv.industry, status: adv.status });
    setDialogOpen(true);
  };

  const handleSuspend = (advId: string) => {
    setAdvertisers((prev) =>
      prev.map((a) => (a.id === advId ? { ...a, status: 'paused' as const } : a))
    );
    toast({ title: t('account.advertiser_suspended') });
  };

  const handleSave = () => {
    if (!form.name || !form.external_id || !form.industry) {
      toast({ title: t('account.fill_all_required'), variant: 'destructive' });
      return;
    }

    if (editing) {
      setAdvertisers((prev) =>
        prev.map((a) => (a.id === editing.id ? { ...a, ...form } : a))
      );
      toast({ title: t('account.advertiser_updated') });
    } else {
      const newAdv: Advertiser = { ...form, id: crypto.randomUUID() };
      setAdvertisers((prev) => [...prev, newAdv]);
      toast({ title: t('account.advertiser_created') });
    }
    setDialogOpen(false);
  };

  const updateForm = (field: keyof Omit<Advertiser, 'id'>, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const StatusRenderer = useCallback((params: ICellRendererParams) => {
    const status = params.value as string;
    return (
      <Badge variant={statusColors[status] as any} className="capitalize text-xs">
        {status}
      </Badge>
    );
  }, []);

  const ActionsRenderer = useCallback(
    (params: ICellRendererParams) => {
      const adv = params.data as Advertiser;
      return (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(adv)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {adv.status === 'active' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-warning"
              onClick={() => handleSuspend(adv.id)}
              title={t('account.suspend_advertiser')}
            >
              <PauseCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      );
    },
    []
  );

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'name', headerName: t('account.advertiser_name').replace(' *', ''), flex: 1.2 },
      { field: 'external_id', headerName: t('account.external_id').replace(' *', ''), flex: 1 },
      { field: 'industry', headerName: t('account.industry'), flex: 1 },
      { field: 'status', headerName: 'Status', flex: 0.7, cellRenderer: StatusRenderer },
      {
        headerName: '',
        field: 'actions',
        width: 90,
        cellRenderer: ActionsRenderer,
        sortable: false,
        filter: false,
      },
    ],
    [t, StatusRenderer, ActionsRenderer]
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('account.advertisers')}</CardTitle>
            <CardDescription>{t('account.manage_advertisers')}</CardDescription>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {t('account.new_advertiser')}
          </Button>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <MobileDataCards
              data={advertisers}
              emptyMessage={t('account.no_advertisers')}
              renderCard={(adv) => (
                <div key={adv.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{adv.name}</p>
                      <p className="text-xs text-muted-foreground">{adv.industry}</p>
                    </div>
                    <Badge variant={statusColors[adv.status] as any} className="capitalize text-xs">
                      {adv.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{adv.external_id}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(adv)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {adv.status === 'active' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-warning" onClick={() => handleSuspend(adv.id)}>
                          <PauseCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className="w-full" style={{ height: 360 }}>
              <AgGridReact
                theme={appGridTheme}
                rowData={advertisers}
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
            <DialogTitle>{editing ? t('account.edit_advertiser') : t('account.create_advertiser')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('account.advertiser_name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="e.g. Careem"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('account.external_id')}</Label>
              <Input
                value={form.external_id}
                onChange={(e) => updateForm('external_id', e.target.value)}
                placeholder="e.g. ADV-10236"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('account.industry_required')}</Label>
              <Select value={form.industry} onValueChange={(v) => updateForm('industry', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('account.select_industry')} />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editing && (
              <div className="space-y-2">
                <Label>{t('account.status')}</Label>
                <Select value={form.status} onValueChange={(v) => updateForm('status', v as Advertiser['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('account.status_active')}</SelectItem>
                    <SelectItem value="paused">{t('account.status_paused')}</SelectItem>
                    <SelectItem value="ended">{t('account.status_ended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave}>
              {editing ? t('account.save_changes') : t('account.create_advertiser_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
