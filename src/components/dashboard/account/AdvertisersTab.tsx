import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef, ICellRendererParams } from 'ag-grid-community';
import { appGridTheme } from '@/components/ui/ag-grid-theme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, PauseCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDataCards } from '@/components/ui/mobile-data-card';
import { OrganizationIndustry } from '@/services/organization';
import { Advertiser } from '@/services/advertiser';
ModuleRegistry.registerModules([AllCommunityModule]);


const INDUSTRIES = [
  'Retail', 'Food & Beverage', 'Technology', 'Healthcare', 'Education',
  'Real Estate', 'Automotive', 'Fashion', 'Finance', 'Travel', 'Entertainment', 'Telecom', 'Other',
];

const statusColors: Record<string, string> = {
  active: 'default',
  paused: 'outline',
  ended: 'destructive',
};


const defaultForm: Record<string, string> = {
  id: '',
  extId: '',
  name: '',
  external_id: '',
  industry: 'HOSPITALITY',
  status: 'ACTIVE',
};

export interface AdvertiserCreateObj {
  advertiserName: string;
  industry: string;
}

export interface AdvertiserUpdateObj {
  advertiserId: string;
  advertiserName: string;
  industry: string;
  status: string;
  extId: string;
}

interface AdvertiserTabProps {
  advertisers: Advertiser[];
  createAdvertiser: (advertiser: AdvertiserCreateObj) => Promise<{status: number, error: Error, message: string}>;
  updateAdvertiser: (advertiser: AdvertiserUpdateObj) => Promise<{status: number, error: Error, message: string}>;
}

export default function AdvertisersTab({ advertisers, createAdvertiser, updateAdvertiser }: AdvertiserTabProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Advertiser | null>(null);
  const [form, setForm] = useState<Omit<Record<string, string>, 'id'>>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (adv: Advertiser) => {
    setEditing(adv);
    setForm({ name: adv.advertiserName, id: adv.id, industry: adv.industry, status: adv.status, extId: adv.extId });
    setDialogOpen(true);
  };

  const handleSuspend = (advId: string) => {
    // setAdvertisers((prev) =>
    //   prev.map((a) => (a.id === advId ? { ...a, status: 'paused' as const } : a))
    // );
    toast({ title: t('account.advertiser_suspended') });
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (!form.name || !form.industry) {
      toast({ title: t('account.fill_all_required'), variant: 'destructive' });
      setIsSaving(false);
      return;
    }

    if (editing) {
      const { status, error,  message} = await updateAdvertiser({
        advertiserId: form.id,
        advertiserName: form.name,
        industry: form.industry,
        status: form.status,
        extId: form.extId
      });
      if(status !== 200 || error){
        toast({ title: message, variant: 'destructive' });
        setIsSaving(false);
        return;
      }
      toast({ title: message });

    } else {
      const { status, error,  message} = await createAdvertiser({
        advertiserName: form.name,
        industry: form.industry
      });
      if(status !== 200 || error){
        toast({ title: message, variant: 'destructive' });
        setIsSaving(false);
        return;
      }
      toast({ title: message });
    }
    setDialogOpen(false);
    setIsSaving(false);
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
      { field: 'advertiserName', headerName: t('account.advertiser_name').replace(' *', ''), flex: 1.2 },
      { field: 'id', headerName: t('account.external_id').replace(' *', ''), flex: 1 },
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
              <Label>{t('account.industry_required')}</Label>
              <Select value={form.industry} onValueChange={(v) => updateForm('industry', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('account.select_industry')} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(OrganizationIndustry).map((i) => (
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
                    <SelectItem value="ACTIVE">{t('account.status_active')}</SelectItem>
                    <SelectItem value="PAUSED">{t('account.status_paused')}</SelectItem>
                    <SelectItem value="ARCHIVED">{t('account.status_archived')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {
                isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (editing ? t('account.save_changes') : t('account.create_advertiser_btn'))
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
