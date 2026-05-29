import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "@/contexts/TranslationContext";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  ColDef,
  ICellRendererParams,
} from "ag-grid-community";
import { appGridTheme } from "@/components/ui/ag-grid-theme";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Send, KeyRound, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { SearchableList } from "@/components/ui/searchable-list";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDataCards } from "@/components/ui/mobile-data-card";
import { useSessionFlags } from "@/hooks/useSessionFlags";
import { teamApi, TeamUser } from "@/services/team";
import { Advertiser, advertiserApi } from "@/services/advertiser";
import { getStoredSession } from "@/services/auth";
// import { useDevFlags } from '@/contexts/DevFlagsContext';

ModuleRegistry.registerModules([AllCommunityModule]);

const statusColors: Record<string, string> = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  ended: "destructive",
};

const ROLE_META: Record<'ADMIN' | 'EDITOR' | 'VIEWER', { label: string; description: string }> = {
  ADMIN: { label: 'Admin', description: 'Has full access to all advertisers, can add and edit users and view all account settings' },
  EDITOR: { label: 'Editor', description: 'Can create and manage shared advertiser campaigns and audio ads' },
  VIEWER: { label: 'Viewer', description: 'Can view shared advertiser campaigns, audio ads and reports' },
};

export default function UsersTab() {
  const isMobile = useIsMobile();
  const { isPro, isAgency, role } = useSessionFlags();
  const [users, setUsers] = useState<TeamUser[]>([]);

  const { t } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null);
  const [form, setForm] = useState<TeamUser>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    status: "ACTIVE",
    role: "VIEWER",
    orgId: "",
    AdvertiserAccounts: "SPECIFIC",
    advertiserId: "",
  } as TeamUser);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);
  const getTeamUsers = async (organizationId: string) => {
    const { data, status, error, message } = await teamApi.getTeamUsers(organizationId);
    if (status !== 200 || error) {
      toast({ title: message, variant: "destructive" });
      return;
    }
    setUsers(data.data);
  }
  const getAdvertisers = async (organizationId: string) => {
      const { data, status, error, message } = await advertiserApi.getAdvertisers(
      organizationId,
    );
    if (status !== 200 || error) {
      toast({ title: message, variant: "destructive" });
      return;
    }
    setAdvertisers(data.data);
  };
  const openCreate = () => {
    setEditingUser(null);
    setForm({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      status: "ACTIVE",
      role: "VIEWER",
      orgId: "",
      AdvertiserAccounts: "SPECIFIC",
      advertiserId: "",
      // SME Pro: pre-fill with all accounts (single advertiser)
    });
    setDialogOpen(true);
  };

  const openEdit = (user: TeamUser) => {
    console.log("user", user);
    setEditingUser(user);
    setForm({ ...user, advertiserId: user.advertiserId || "", AdvertiserAccounts: user.AdvertiserAccounts || "SPECIFIC" });
    setDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    const session = getStoredSession();
    if (!session) {
      toast({ title: "Session not found", variant: "destructive" });
      return;
    }
    const { status, error, message } = await teamApi.deleteTeamUser(userId, session.currentOrganizationId);
    if(status !== 200 || error){
      toast({ title: message, variant: "destructive" });
      return;
    }
    toast({ title: message });
    getTeamUsers(session.currentOrganizationId);
    setDialogOpen(false);
    setDeleteConfirmOpen(false);
  };

  const handleSave = async () => {
    if (!form.email || !form.firstName || !form.lastName) {
      toast({ title: t("account.fill_required"), variant: "destructive" });
      return;
    }
    const session = getStoredSession();
    if (!session) {
      toast({ title: "Session not found", variant: "destructive" });
      return;
    }


    if(form.AdvertiserAccounts === "SPECIFIC" && !form.advertiserId) {
      toast({ title: "Please select at least one advertiser account", variant: "destructive" });
      return;
    }

    let newRole = form.role;

    if(form.AdvertiserAccounts === "SPECIFIC") {
      newRole = form.role === "EDITOR" ? "EDITOR_RESTRICTED" : form.role === "VIEWER" ? "VIEWER_RESTRICTED" : form.role;
    } else if(form.AdvertiserAccounts === "ALL") {
      newRole = form.role === "EDITOR_RESTRICTED" ? "EDITOR" : form.role === "VIEWER_RESTRICTED" ? "VIEWER" : form.role;
    }
    

    if (editingUser) {
      const { status, error, message } = await teamApi.updateTeamUser({
        ...form, 
        role: newRole,
        advertiserId: form.advertiserId ? typeof form.advertiserId === "string" ? form.advertiserId.split(",") : form.advertiserId : [], 
        AdvertiserAccounts: form.role === "ADMIN" ? "ALL" : form.AdvertiserAccounts
      }, 
      session.currentOrganizationId
    );
      setSendingInvite(false);
      if(status !== 200 || error){
        toast({ title: message, variant: "destructive" });
        return;
      }
      toast({ title: message });
      setDialogOpen(false);
      getTeamUsers(session.currentOrganizationId);
    }
    setDialogOpen(false);
  };

  const handleSendInvite = async () => {
    const session = getStoredSession();
    if (!session) {
      toast({ title: "Session not found", variant: "destructive" });
      return;
    }
    if (!form.email || !form.firstName || !form.lastName) {
      toast({ title: t("account.fill_required"), variant: "destructive" });
      return;
    }

    if(form.role !== "ADMIN" &&  form.AdvertiserAccounts === "SPECIFIC" && !form.advertiserId) {
      toast({ title: "Please select at least one advertiser account", variant: "destructive" });
      return;
    }

    if (editingUser) {

      setSendingInvite(true);

      //const { status, error, message } = await teamApi.updateTeamUser({...form, advertiserId: form.advertiserId ? typeof form.advertiserId === "string" ? form.advertiserId.split(",") : form.advertiserId : []}, session.currentOrganizationId);
      
      const { status, error, message } = await teamApi.resendInvite(editingUser.id,typeof form.advertiserId === "string" ? form.advertiserId : form.advertiserId[0]);
      setSendingInvite(false);
      if(status !== 200 || error){
        toast({ title: message, variant: "destructive" });
        return;
      }
      toast({ title: message });
      setDialogOpen(false);
      getTeamUsers(session.currentOrganizationId);
      
    } else {
      // const newUser: TeamUser = {
      //   ...form,
      //   id: crypto.randomUUID(),
      //   status: "active",
      //   invited_at: new Date().toISOString().split("T")[0],
      // };
      // setUsers((prev) => [...prev, newUser]);
      setSendingInvite(true);
      const adIds = form.advertiserId ? typeof form.advertiserId === "string" ? form.advertiserId.split(",") : form.advertiserId : [];
      const { status, error, message } = await teamApi.createTeamUser({
          ...form, 
          advertiserId: adIds, 
          role: form.role === "ADMIN" ? "ADMIN" : form.role === "EDITOR" ? form.AdvertiserAccounts === "SPECIFIC" ? "EDITOR_RESTRICTED" : "EDITOR" : form.role === "VIEWER" ? "VIEWER" : "VIEWER_RESTRICTED",
          AdvertiserAccounts: form.role === "ADMIN" ? "ALL" : form.AdvertiserAccounts
        }, 
        session.currentOrganizationId
      );
      setSendingInvite(false);
      if(status !== 200 || error){
        toast({ title: message, variant: "destructive" });
        return;
      }
      toast({ title: message });
      setDialogOpen(false);
      getTeamUsers(session.currentOrganizationId);

    }
    toast({
      title: t("account.invite_sent"),
      description: t("account.invite_sent_to", { email: form.email }),
    });
    setDialogOpen(false);
  };

  const handleResetPassword = async () => {
    const session = getStoredSession();
    if (!session) {
      toast({ title: "Session not found", variant: "destructive" });
      return;
    }
   
    setIsResetPasswordLoading(true);
    const { status, error, message } = await teamApi.resetPassword(editingUser.id);
    setIsResetPasswordLoading(false);
    if(status !== 200 || error){
      toast({ title: message, variant: "destructive" });
      return;  
    }
    toast({ title: message });
    setDialogOpen(false);
  };

  const updateForm = (field: keyof Omit<TeamUser, "id">, value: any) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Derive display label for accounts column
  const getAccountsDisplay = (user: TeamUser) => {
    if (isPro) return "Own Account";
    if (user.AdvertiserAccounts === "ALL") return "All Accounts";
    if (user.AdvertiserAccounts === "SPECIFIC") return "Specific Accounts";
    return "None";
  };

  const StatusRenderer = useCallback((params: ICellRendererParams) => {
    const status = params.value as string;
    return (
      <Badge
        variant={statusColors[status] as any}
        className="capitalize text-xs"
      >
        {status}
      </Badge>
    );
  }, []);

  const RightsRenderer = useCallback((params: ICellRendererParams) => {
    const rights = params.value as string;
    const labels: Record<string, string> = {
      admin: t("account.rights_admin_label"),
      edit: t("account.rights_edit_label"),
      view: t("account.rights_view_label"),
    };
    return (
      <span className="text-sm capitalize">{labels[rights] || rights}</span>
    );
  }, []);

  const AccountsRenderer = useCallback(
    (params: ICellRendererParams) => {
      const user = params.data as TeamUser;
      return (
        <span className="text-sm truncate">{getAccountsDisplay(user)}</span>
      );
    },
    [isPro],
  );

  const ActionsRenderer = useCallback((params: ICellRendererParams) => {
    const user = params.data as TeamUser;
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => openEdit(user)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={() => handleDelete(user.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }, []);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "firstName", headerName: t("account.first_name"), flex: 1 },
      { field: "lastName", headerName: t("account.last_name"), flex: 1 },
      { field: "email", headerName: t("account.email"), flex: 1.5 },
      { field: "phone", headerName: t("account.phone"), flex: 1 },
      {
        field: "AdvertiserAccounts",
        headerName: t("account.advertiser_accounts"),
        flex: 1,
      },
      {
        field: "role",
        headerName: t("account.rights"),
        flex: 0.8,
        cellRenderer: RightsRenderer,
      },
      {
        field: "status",
        headerName: t("account.status"),
        flex: 0.7,
        cellRenderer: StatusRenderer,
      },
      {
        headerName: "",
        field: "actions",
        width: role === "ADMIN" || role === "EDITOR" ? 90 : 0,
        cellRenderer: role === "ADMIN" || role === "EDITOR" ? ActionsRenderer : undefined,
        sortable: false,
        filter: false,
      },
    ],
    [StatusRenderer, RightsRenderer, ActionsRenderer, AccountsRenderer, role],
  );

  useEffect(() => {
    const load = async () => {
      const session = getStoredSession();
      if (!session) {
        toast({ title: "Session not found", variant: "destructive" });
        return;
      }
      getTeamUsers(session.currentOrganizationId);
      getAdvertisers(session.currentOrganizationId);
    };
    load();
  }, []);

  // Don't render for Express mode (single user — handled by Account.tsx hiding the tab)
  // But as a safety net:
  if (!isPro) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("account.team_users")}</CardTitle>
            <CardDescription>{t("account.manage_team")}</CardDescription>
          </div>
          {
            role === "ADMIN" && (
              <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              {t("account.new_user")}
            </Button>                
            )
          }
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <MobileDataCards
              data={users}
              emptyMessage={t("account.no_team_members")}
              renderCard={(user) => (
                <div key={user.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Badge
                      variant={statusColors[user.status] as any}
                      className="capitalize text-xs"
                    >
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground capitalize">
                        {user.role === "admin"
                          ? t("account.rights_admin_label")
                          : user.role === "edit"
                            ? t("account.rights_edit_label")
                            : t("account.rights_view_label")}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {getAccountsDisplay(user)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(user.id)}
                      >
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

      {/* Create / Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Create New User"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[600px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("account.first_name_required")}</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => updateForm("firstName", e.target.value)}
                  placeholder="Sarah"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("account.last_name_required")}</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => updateForm("lastName", e.target.value)}
                  placeholder="Ahmed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("account.email_required")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder="user@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("account.phone_number")}</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                placeholder="+971..."
              />
            </div>

            {/* Advertiser Accounts — varies by account type */}
            {/* {isPro && (
              <div className="space-y-2">
                <Label>Advertiser Account</Label>
                <Input
                  value="Own Account"
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">SME Pro accounts are linked to a single advertiser</p>
              </div>
            )} */}


            <div className="space-y-3">
              <Label>{t("account.rights")}</Label>

              <Select value={form.role === "EDITOR_RESTRICTED" ? "EDITOR" : form.role === "VIEWER_RESTRICTED" ? "VIEWER" : form.role} onValueChange={(v) => updateForm('role', v as TeamUser['role'])}>
                <SelectTrigger className="h-auto py-2 items-start">
                  <SelectValue placeholder="Select a role">
                    {form.role && ROLE_META[form.role === "EDITOR_RESTRICTED" ? "EDITOR" : form.role === "VIEWER_RESTRICTED" ? "VIEWER" : form.role as 'ADMIN' | 'EDITOR' | 'VIEWER'] && (
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{ROLE_META[form.role === "EDITOR_RESTRICTED" ? "EDITOR" : form.role === "VIEWER_RESTRICTED" ? "VIEWER" : form.role].label}</span>
                        <span className="text-xs text-muted-foreground whitespace-normal">
                          {ROLE_META[form.role === "EDITOR_RESTRICTED" ? "EDITOR" : form.role === "VIEWER_RESTRICTED" ? "VIEWER" : form.role].description}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                  {(Object.keys(ROLE_META) as Array<'admin' | 'edit' | 'view'>).map((key) => (
                    <SelectItem key={key} value={key} className="group">
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{ROLE_META[key].label}</span>
                        <span className="text-xs text-muted-foreground whitespace-normal group-focus:text-accent-foreground/90 group-data-[highlighted]:text-accent-foreground/90">
                          {ROLE_META[key].description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {isAgency && (form.role !== "ADMIN") && (
              <div className="space-y-4">

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>All Advertisers</Label>
                    <Switch
                      checked={form.AdvertiserAccounts === "ALL"}
                      onCheckedChange={(checked) =>
                        updateForm("AdvertiserAccounts", checked ? "ALL" : "SPECIFIC")
                      }
                      size="sm"
                    />
                  </div>
                                  {
                  form.AdvertiserAccounts === "ALL" ? (
                    <p className="text-xs text-muted-foreground">This user will automatically get access to all the advertiser accounts including the ones created in the future.</p>
                  )
                  : (
                    <p className="text-xs text-muted-foreground">This user will get access to specific advertiser accounts</p>
                  )
                }
                </div>



                {
                  form.AdvertiserAccounts === "SPECIFIC" && (
                    <div className="space-y-2">
                    <Label>Specific Advertiser Accounts </Label>
                    <SearchableList
                      items={advertisers}
                      columns={[
                        { key: "advertiserName", label: "Advertiser Name", sortable: true },
                        {
                          key: "industry",
                          label: "Industry",
                          hideOnMobile: true,
                        },
                      ]}
                      selectionMode="multi"
                      selectedIds={form.advertiserId ? typeof form.advertiserId === "string" ? form.advertiserId.split(",") : form.advertiserId : []}
                      onSelectionChange={(ids) => updateForm("advertiserId", typeof form.advertiserId === "string" ? ids.join(",") : ids)}
                      selectAllFiltered
                      idKey="id"
                      searchPlaceholder="Search advertisers..."
                      collapsible
                      collapsibleLabel="Select advertiser accounts..."
                      defaultOpen={false}
                      maxHeight="200px"
                      pageSize={50}
                      emptyMessage="No advertisers found"
                    />
                  </div>
                      
                  )
                }

               
              </div>
            )}


            {/* {editingUser && (
              <div className="space-y-2">
                <Label>{t("account.user_status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    updateForm("status", v as TeamUser["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="DELETED">Ended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )} */}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {editingUser && (
              <div className="flex gap-2 mr-auto">
                {/* <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete User
                </Button> */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={isResetPasswordLoading}
                >
                  <KeyRound className="h-4 w-4 mr-1" />
                  {isResetPasswordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                </Button>
              </div>
            )}
            <div className="flex gap-2">
            <Button onClick={handleSendInvite} disabled={sendingInvite} variant="outline">
                <Send className="h-4 w-4 mr-1" />
                {editingUser
                  ? t("account.resend_invite")
                  : t("account.send_invite")}
              </Button>
              {
                editingUser && (
                  <Button  onClick={handleSave}>
                    {t("account.save_changes")}
                </Button>
  
                )
              }
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {editingUser?.firstName} {editingUser?.lastName}
            </span>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingUser && handleDelete(editingUser.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
