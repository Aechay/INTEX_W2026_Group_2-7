import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CircleAlert,
  ClipboardList,
  FileBarChart2,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Megaphone,
  Pencil,
  Plus,
  Settings,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import AdminWorkspace, { type AdminNavItem } from "@/components/admin/AdminWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { withPathLanguage } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type ResidentOption = {
  residentId: number;
  internalCode: string;
  caseControlNo: string;
  firstName?: string | null;
  lastName?: string | null;
};

type HomeVisitationDetail = {
  visitationId: number;
  residentId: number;
  residentDisplayName: string;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  locationVisited: string;
  familyMembersPresent: string;
  purpose: string;
  observations: string;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  followUpNotes: string | null;
  visitOutcome: string;
};

type HomeVisitationCard = {
  visitationId: number;
  residentId: number;
  residentDisplayName: string;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  visitOutcome: string;
};

type HomeVisitationUpsertForm = {
  residentId: number;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  locationVisited: string;
  familyMembersPresent: string;
  purpose: string;
  observations: string;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  followUpNotes: string;
  visitOutcome: string;
};

const VISIT_TYPES = ["Emergency", "Initial Assessment", "Post-Placement Monitoring", "Reintegration Assessment", "Routine Follow-Up"];
const COOPERATION_LEVELS = ["High", "Moderate", "Low", "Resistant", "Unknown"];
const OUTCOMES = ["Favorable", "Needs Improvement", "Unfavorable", "Inconclusive"];

const ITEMS_PER_PAGE = 10;

const emptyForm = (): HomeVisitationUpsertForm => ({
  residentId: 0,
  visitDate: new Date().toISOString().slice(0, 10),
  socialWorker: "",
  visitType: "Routine Follow-Up",
  locationVisited: "",
  familyMembersPresent: "",
  purpose: "",
  observations: "",
  familyCooperationLevel: "Moderate",
  safetyConcernsNoted: false,
  followUpNeeded: false,
  followUpNotes: "",
  visitOutcome: "Inconclusive",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

const getOutcomeBadgeClass = (outcome: string) => {
  switch (outcome) {
    case "Favorable":
      return "border-0 bg-primary/10 text-primary";
    case "Needs Improvement":
      return "border-0 bg-accent/20 text-foreground";
    case "Unfavorable":
      return "border-0 bg-destructive/10 text-destructive";
    default:
      return "border-0 bg-muted text-muted-foreground";
  }
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    {children}
  </div>
);

const HomeVisitation = () => {
  const auth = useAuth();
  const { i18n, t } = useTranslation("homeVisitation");
  const queryClient = useQueryClient();
  const [signOutPending, setSignOutPending] = useState(false);
  const [residentFilter, setResidentFilter] = useState("all");
  const [visitTypeFilter, setVisitTypeFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<HomeVisitationUpsertForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dashboardPath = withPathLanguage("/dashboard", i18n.resolvedLanguage);
  const socialMediaPath = withPathLanguage("/dashboard/social-media", i18n.resolvedLanguage);
  const caseloadPath = withPathLanguage("/dashboard/caseload", i18n.resolvedLanguage);
  const donationsPath = withPathLanguage("/dashboard/donations", i18n.resolvedLanguage);
  const processRecordingPath = withPathLanguage("/dashboard/process-recordings", i18n.resolvedLanguage);
  const homeVisitationPath = withPathLanguage("/dashboard/home-visitations", i18n.resolvedLanguage);
  const reportsPath = withPathLanguage("/dashboard/reports", i18n.resolvedLanguage);

  const navigationItems: AdminNavItem[] = [
    { label: t("sidebar.dashboard"), icon: LayoutDashboard, to: dashboardPath },
    { label: t("sidebar.socialMedia"), icon: Megaphone, to: socialMediaPath },
    { label: t("sidebar.residents"), icon: UsersRound, to: caseloadPath },
    { label: t("sidebar.donations"), icon: HeartHandshake, to: donationsPath },
    { label: t("sidebar.caseConferences"), icon: CalendarClock, disabled: true },
    { label: t("sidebar.processRecording"), icon: ClipboardList, to: processRecordingPath },
    { label: t("sidebar.homeVisitation"), icon: CalendarClock, to: homeVisitationPath, active: true },
    { label: t("sidebar.safehouses"), icon: Home, disabled: true },
    { label: t("sidebar.reports"), icon: FileBarChart2, to: reportsPath },
    { label: t("sidebar.settings"), icon: Settings, disabled: true },
  ];

  const residentsQuery = useQuery({
    queryKey: ["admin-caseload-residents"],
    queryFn: () =>
      auth.authenticatedJson<{ residents: ResidentOption[] }>("/api/admin/caseload/residents"),
    select: (data) => data.residents,
  });

  const visitationsQuery = useQuery({
    queryKey: ["admin-home-visitations", residentFilter, visitTypeFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (residentFilter !== "all") params.set("residentId", residentFilter);
      if (visitTypeFilter !== "all") params.set("visitType", visitTypeFilter);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return auth.authenticatedJson<HomeVisitationCard[]>(`/api/admin/home-visitations${suffix}`);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number | null; body: HomeVisitationUpsertForm }) => {
      const payload = {
        ...body,
        visitDate: body.visitDate,
        followUpNotes: body.followUpNotes.trim() || null,
      };
      if (id) {
        return auth.authenticatedJson<HomeVisitationCard>(`/api/admin/home-visitations/${id}`, {
          method: "PUT",
          body: payload,
        });
      }
      return auth.authenticatedJson<HomeVisitationCard>("/api/admin/home-visitations", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-home-visitations"] });
      setDialogOpen(false);
      setSaveError(null);
    },
    onError: (error) => {
      setSaveError(getErrorMessage(error, t("errors.saveFailed")));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      auth.authenticatedJson(`/api/admin/home-visitations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-home-visitations"] });
      setDeleteId(null);
    },
  });

  const handleLogout = async () => {
    setSignOutPending(true);
    try {
      await auth.logout();
    } finally {
      setSignOutPending(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setSaveError(null);
    setDialogOpen(true);
  };

  const openEdit = async (visitation: HomeVisitationCard) => {
    setEditingId(visitation.visitationId);
    setSaveError(null);
    setForm({
      residentId: visitation.residentId,
      visitDate: visitation.visitDate.slice(0, 10),
      socialWorker: visitation.socialWorker,
      visitType: visitation.visitType,
      locationVisited: "",
      familyMembersPresent: "",
      purpose: "",
      observations: "",
      familyCooperationLevel: visitation.familyCooperationLevel,
      safetyConcernsNoted: visitation.safetyConcernsNoted,
      followUpNeeded: visitation.followUpNeeded,
      followUpNotes: "",
      visitOutcome: visitation.visitOutcome,
    });
    setDialogOpen(true);
    try {
      const detail = await auth.authenticatedJson<HomeVisitationDetail>(
        `/api/admin/home-visitations/${visitation.visitationId}`,
      );
      setForm((f) => ({
        ...f,
        locationVisited: detail.locationVisited,
        familyMembersPresent: detail.familyMembersPresent,
        purpose: detail.purpose,
        observations: detail.observations,
        followUpNotes: detail.followUpNotes ?? "",
      }));
    } catch {
      // Non-critical: basic fields already populated from card data
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    upsertMutation.mutate({ id: editingId, body: form });
  };

  const visitations = (visitationsQuery.data ?? []).filter(
    (v) => outcomeFilter === "all" || v.visitOutcome === outcomeFilter,
  );
  const totalPages = Math.max(1, Math.ceil(visitations.length / ITEMS_PER_PAGE));
  const paginatedVisitations = visitations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <AdminWorkspace
      items={navigationItems}
      signOutPending={signOutPending}
      onSignOut={handleLogout}
    >
      {/* Header */}
      <div className="border border-border bg-card">
        <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {t("header.kicker")}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {t("header.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("header.description")}
            </p>
          </div>
          <Button type="button" className="w-fit" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("actions.newVisit")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("filters.resident")}
              </Label>
              <Select
                value={residentFilter}
                onValueChange={(value) => {
                  setResidentFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="rounded-none" aria-label={t("filters.resident")}>
                  <SelectValue placeholder={t("filters.allResidents")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allResidents")}</SelectItem>
                  {(residentsQuery.data ?? []).map((r) => (
                    <SelectItem key={r.residentId} value={String(r.residentId)}>
                      {r.firstName ? `${r.firstName} ${r.lastName ?? ""}`.trim() : `${r.internalCode} — ${r.caseControlNo}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("filters.visitType")}
              </Label>
              <Select
                value={visitTypeFilter}
                onValueChange={(value) => {
                  setVisitTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="rounded-none" aria-label={t("filters.visitType")}>
                  <SelectValue placeholder={t("filters.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  {VISIT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Outcome
              </Label>
              <Select
                value={outcomeFilter}
                onValueChange={(value) => {
                  setOutcomeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="rounded-none" aria-label="Outcome">
                  <SelectValue placeholder="All Outcomes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Outcomes</SelectItem>
                  {OUTCOMES.map((outcome) => (
                    <SelectItem key={outcome} value={outcome}>{outcome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {visitationsQuery.isError ? (
        <Card className="rounded-none border border-destructive/20 bg-card shadow-none">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <div className="border-l-4 border-destructive pl-3 text-destructive">
              <CircleAlert className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(visitationsQuery.error, t("errors.loadFailed"))}
            </p>
            <Button type="button" onClick={() => void visitationsQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-none border border-border bg-card shadow-none">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-lg font-semibold">
              {visitations.length} {visitations.length === 1 ? "record" : "records"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {visitationsQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-muted" />
                ))}
              </div>
            ) : visitations.length === 0 ? (
              <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">
                {t("table.noRecords")}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table.visitDate")}</TableHead>
                        <TableHead>{t("table.resident")}</TableHead>
                        <TableHead>{t("table.socialWorker")}</TableHead>
                        <TableHead>{t("table.visitType")}</TableHead>
                        <TableHead>{t("table.cooperation")}</TableHead>
                        <TableHead>{t("table.safetyConcerns")}</TableHead>
                        <TableHead>{t("table.outcome")}</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedVisitations.map((visit) => (
                        <TableRow key={visit.visitationId}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(visit.visitDate)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {visit.residentDisplayName}
                          </TableCell>
                          <TableCell className="text-sm">{visit.socialWorker}</TableCell>
                          <TableCell className="text-sm">{visit.visitType}</TableCell>
                          <TableCell className="text-sm">{visit.familyCooperationLevel}</TableCell>
                          <TableCell>
                            {visit.safetyConcernsNoted ? (
                              <Badge variant="outline" className="rounded-none border-0 bg-destructive/10 text-destructive text-xs">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("rounded-none text-xs", getOutcomeBadgeClass(visit.visitOutcome))}
                            >
                              {visit.visitOutcome}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                aria-label="Edit home visitation"
                                onClick={() => openEdit(visit)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                aria-label="Delete home visitation"
                                onClick={() => setDeleteId(visit.visitationId)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border px-4 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-none"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-border bg-card p-0 shadow-xl sm:max-w-[800px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>
              {editingId ? t("dialog.editTitle") : t("dialog.createTitle")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <Field label={t("dialog.resident")}>
                <Select
                  value={form.residentId ? String(form.residentId) : ""}
                  onValueChange={(value) => setForm((f) => ({ ...f, residentId: Number(value) }))}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {(residentsQuery.data ?? []).map((r) => (
                      <SelectItem key={r.residentId} value={String(r.residentId)}>
                        {r.firstName ? `${r.firstName} ${r.lastName ?? ""}`.trim() : `${r.internalCode} — ${r.caseControlNo}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("dialog.visitDate")}>
                <Input
                  type="date"
                  className="rounded-none"
                  value={form.visitDate}
                  onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))}
                  required
                />
              </Field>

              <Field label={t("dialog.socialWorker")}>
                <Input
                  className="rounded-none"
                  value={form.socialWorker}
                  onChange={(e) => setForm((f) => ({ ...f, socialWorker: e.target.value }))}
                  required
                />
              </Field>

              <Field label={t("dialog.visitType")}>
                <Select
                  value={form.visitType}
                  onValueChange={(value) => setForm((f) => ({ ...f, visitType: value }))}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("dialog.locationVisited")}>
                <Input
                  className="rounded-none"
                  value={form.locationVisited}
                  onChange={(e) => setForm((f) => ({ ...f, locationVisited: e.target.value }))}
                />
              </Field>

              <Field label={t("dialog.familyMembersPresent")}>
                <Input
                  className="rounded-none"
                  value={form.familyMembersPresent}
                  onChange={(e) => setForm((f) => ({ ...f, familyMembersPresent: e.target.value }))}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label={t("dialog.purpose")}>
                  <textarea
                    className="min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                    value={form.purpose}
                    onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label={t("dialog.observations")}>
                  <textarea
                    className="min-h-[100px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                    value={form.observations}
                    onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label={t("dialog.familyCooperationLevel")}>
                <Select
                  value={form.familyCooperationLevel}
                  onValueChange={(value) => setForm((f) => ({ ...f, familyCooperationLevel: value }))}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COOPERATION_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("dialog.visitOutcome")}>
                <Select
                  value={form.visitOutcome}
                  onValueChange={(value) => setForm((f) => ({ ...f, visitOutcome: value }))}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map((outcome) => (
                      <SelectItem key={outcome} value={outcome}>{outcome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="safetyConcernsNoted"
                  checked={form.safetyConcernsNoted}
                  onChange={(e) => setForm((f) => ({ ...f, safetyConcernsNoted: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="safetyConcernsNoted">{t("dialog.safetyConcernsNoted")}</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followUpNeeded"
                  checked={form.followUpNeeded}
                  onChange={(e) => setForm((f) => ({ ...f, followUpNeeded: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="followUpNeeded">{t("dialog.followUpNeeded")}</Label>
              </div>

              {form.followUpNeeded && (
                <div className="sm:col-span-2">
                  <Field label={t("dialog.followUpNotes")}>
                    <textarea
                      className="min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                      value={form.followUpNotes}
                      onChange={(e) => setForm((f) => ({ ...f, followUpNotes: e.target.value }))}
                    />
                  </Field>
                </div>
              )}
            </div>

            {saveError ? (
              <div className="mx-6 mb-4 rounded-none border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {saveError}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => setDialogOpen(false)}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="submit"
                className="rounded-none"
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending ? "Saving…" : t("actions.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-none border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  );
};

export default HomeVisitation;
