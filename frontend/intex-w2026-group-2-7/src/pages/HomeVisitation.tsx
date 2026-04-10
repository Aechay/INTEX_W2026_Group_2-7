import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CircleAlert,
  ClipboardList,
  FileBarChart2,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  Pencil,
  Plus,
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
import { Switch } from "@/components/ui/switch";
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

// ─── Shared ────────────────────────────────────────────────────────────────

type ResidentOption = {
  residentId: number;
  internalCode: string;
  caseControlNo: string;
  firstName?: string | null;
  lastName?: string | null;
};

const ITEMS_PER_PAGE = 10;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

const today = new Date().toISOString().slice(0, 10);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    {children}
  </div>
);

// ─── Home Visit types ───────────────────────────────────────────────────────

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

const emptyVisitForm = (): HomeVisitationUpsertForm => ({
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

const getOutcomeBadgeClass = (outcome: string) => {
  switch (outcome) {
    case "Favorable": return "border-0 bg-primary/10 text-primary";
    case "Needs Improvement": return "border-0 bg-amber-500/15 text-yellow-900";
    case "Unfavorable": return "border-0 bg-destructive/10 text-destructive";
    default: return "border-0 bg-muted text-muted-foreground";
  }
};

// ─── Intervention Plan types ────────────────────────────────────────────────

type PlanCard = {
  planId: number;
  residentId: number;
  residentDisplayName: string;
  planCategory: string;
  status: string;
  targetDate: string;
  caseConferenceDate: string | null;
  servicesProvided: string;
};

type PlanDetail = {
  planId: number;
  residentId: number;
  residentDisplayName: string;
  planCategory: string;
  planDescription: string;
  servicesProvided: string;
  targetValue: number;
  targetDate: string;
  status: string;
  caseConferenceDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type PlanUpsertForm = {
  residentId: number;
  planCategory: string;
  planDescription: string;
  servicesProvided: string;
  targetValue: string;
  targetDate: string;
  status: string;
  caseConferenceDate: string;
};

const PLAN_CATEGORIES = ["Education", "Health", "Reintegration", "Legal", "Psychosocial", "Employment", "Family Reunification", "Other"];
const PLAN_STATUSES = ["In Progress", "On Hold", "Achieved", "Open"];

const emptyPlanForm = (): PlanUpsertForm => ({
  residentId: 0,
  planCategory: "Education",
  planDescription: "",
  servicesProvided: "",
  targetValue: "0",
  targetDate: new Date().toISOString().slice(0, 10),
  status: "In Progress",
  caseConferenceDate: "",
});

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "In Progress": return "border-0 bg-primary/10 text-primary";
    case "Achieved": return "border-0 bg-accent/20 text-foreground";
    case "On Hold": return "border-0 bg-amber-500/15 text-yellow-900";
    case "Open": return "border-0 bg-muted text-muted-foreground";
    default: return "border-0 bg-accent/10 text-foreground";
  }
};

// ─── Component ─────────────────────────────────────────────────────────────

const HomeVisitation = () => {
  const auth = useAuth();
  const { i18n, t } = useTranslation("homeVisitation");
  const queryClient = useQueryClient();
  const [signOutPending, setSignOutPending] = useState(false);

  // Visit state
  const [visitSearch, setVisitSearch] = useState("");
  const [residentFilter, setResidentFilter] = useState("all");
  const [filterResidentSearch, setFilterResidentSearch] = useState("");
  const [visitTypeFilter, setVisitTypeFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [visitSafetyConcernsFilter, setVisitSafetyConcernsFilter] = useState<"all" | "flagged" | "clear">("all");
  const [visitPage, setVisitPage] = useState(1);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState<number | null>(null);
  const [visitForm, setVisitForm] = useState<HomeVisitationUpsertForm>(emptyVisitForm());
  const [deleteVisitId, setDeleteVisitId] = useState<number | null>(null);
  const [visitSaveError, setVisitSaveError] = useState<string | null>(null);
  const [viewVisitDetail, setViewVisitDetail] = useState<HomeVisitationDetail | null>(null);
  const [viewVisitDialogOpen, setViewVisitDialogOpen] = useState(false);

  // Plan state
  const [planSearch, setPlanSearch] = useState("");
  const [planResidentFilter, setPlanResidentFilter] = useState("all");
  const [planResidentSearch, setPlanResidentSearch] = useState("");
  const [planStatusFilter, setPlanStatusFilter] = useState("all");
  const [planPage, setPlanPage] = useState(1);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [planForm, setPlanForm] = useState<PlanUpsertForm>(emptyPlanForm());
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);
  const [planSaveError, setPlanSaveError] = useState<string | null>(null);
  const [viewPlanDetail, setViewPlanDetail] = useState<PlanDetail | null>(null);
  const [viewPlanDialogOpen, setViewPlanDialogOpen] = useState(false);

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
    { label: t("sidebar.processRecording"), icon: ClipboardList, to: processRecordingPath },
    { label: t("sidebar.caseConferences"), icon: CalendarClock, to: homeVisitationPath, active: true },
    { label: t("sidebar.reports"), icon: FileBarChart2, to: reportsPath },
  ];

  // ─── Queries ──────────────────────────────────────────────────────────────

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

  const plansQuery = useQuery({
    queryKey: ["admin-case-conferences", planResidentFilter, planStatusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (planResidentFilter !== "all") params.set("residentId", planResidentFilter);
      if (planStatusFilter !== "all") params.set("status", planStatusFilter);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return auth.authenticatedJson<PlanCard[]>(`/api/admin/case-conferences${suffix}`);
    },
  });

  // ─── Visit mutations ──────────────────────────────────────────────────────

  const upsertVisitMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number | null; body: HomeVisitationUpsertForm }) => {
      const payload = { ...body, followUpNotes: body.followUpNotes.trim() || null };
      if (id) {
        return auth.authenticatedJson<HomeVisitationCard>(`/api/admin/home-visitations/${id}`, { method: "PUT", body: payload });
      }
      return auth.authenticatedJson<HomeVisitationCard>("/api/admin/home-visitations", { method: "POST", body: payload });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-home-visitations"] });
      setVisitDialogOpen(false);
      setVisitSaveError(null);
    },
    onError: (error) => setVisitSaveError(getErrorMessage(error, t("errors.saveFailed"))),
  });

  const deleteVisitMutation = useMutation({
    mutationFn: (id: number) =>
      auth.authenticatedJson(`/api/admin/home-visitations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-home-visitations"] });
      setDeleteVisitId(null);
    },
  });

  // ─── Plan mutations ───────────────────────────────────────────────────────

  const upsertPlanMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number | null; body: PlanUpsertForm }) => {
      const payload = {
        residentId: body.residentId,
        planCategory: body.planCategory,
        planDescription: body.planDescription,
        servicesProvided: body.servicesProvided,
        targetValue: parseFloat(body.targetValue) || 0,
        targetDate: body.targetDate,
        status: body.status,
        caseConferenceDate: body.caseConferenceDate || null,
      };
      if (id) {
        return auth.authenticatedJson<PlanCard>(`/api/admin/case-conferences/${id}`, { method: "PUT", body: payload });
      }
      return auth.authenticatedJson<PlanCard>("/api/admin/case-conferences", { method: "POST", body: payload });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-case-conferences"] });
      setPlanDialogOpen(false);
      setPlanSaveError(null);
    },
    onError: (error) => setPlanSaveError(getErrorMessage(error, t("errors.saveFailed"))),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: number) =>
      auth.authenticatedJson(`/api/admin/case-conferences/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-case-conferences"] });
      setDeletePlanId(null);
    },
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    setSignOutPending(true);
    try { await auth.logout(); } finally { setSignOutPending(false); }
  };

  const openCreateVisit = () => {
    setEditingVisitId(null);
    setVisitForm(emptyVisitForm());
    setVisitSaveError(null);
    setVisitDialogOpen(true);
  };

  const openEditVisit = async (visitation: HomeVisitationCard) => {
    setEditingVisitId(visitation.visitationId);
    setVisitSaveError(null);
    setVisitForm({
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
    setVisitDialogOpen(true);
    try {
      const detail = await auth.authenticatedJson<HomeVisitationDetail>(`/api/admin/home-visitations/${visitation.visitationId}`);
      setVisitForm((f) => ({ ...f, locationVisited: detail.locationVisited, familyMembersPresent: detail.familyMembersPresent, purpose: detail.purpose, observations: detail.observations, followUpNotes: detail.followUpNotes ?? "" }));
    } catch { /* non-critical */ }
  };

  const openViewVisit = async (visit: HomeVisitationCard) => {
    setViewVisitDetail(null);
    setViewVisitDialogOpen(true);
    try {
      const detail = await auth.authenticatedJson<HomeVisitationDetail>(`/api/admin/home-visitations/${visit.visitationId}`);
      setViewVisitDetail(detail);
    } catch { setViewVisitDialogOpen(false); }
  };

  const openCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm(emptyPlanForm());
    setPlanSaveError(null);
    setPlanDialogOpen(true);
  };

  const openEditPlan = async (plan: PlanCard) => {
    setEditingPlanId(plan.planId);
    setPlanSaveError(null);
    setPlanForm({
      residentId: plan.residentId,
      planCategory: plan.planCategory,
      planDescription: "",
      servicesProvided: plan.servicesProvided,
      targetValue: "0",
      targetDate: plan.targetDate.slice(0, 10),
      status: plan.status,
      caseConferenceDate: plan.caseConferenceDate?.slice(0, 10) ?? "",
    });
    setPlanDialogOpen(true);
    try {
      const detail = await auth.authenticatedJson<PlanDetail>(`/api/admin/case-conferences/${plan.planId}`);
      setPlanForm((f) => ({ ...f, planDescription: detail.planDescription, servicesProvided: detail.servicesProvided, targetValue: String(detail.targetValue) }));
    } catch { /* non-critical */ }
  };

  const openViewPlan = async (plan: PlanCard) => {
    setViewPlanDetail(null);
    setViewPlanDialogOpen(true);
    try {
      const detail = await auth.authenticatedJson<PlanDetail>(`/api/admin/case-conferences/${plan.planId}`);
      setViewPlanDetail(detail);
    } catch { setViewPlanDialogOpen(false); }
  };

  // ─── Derived data ──────────────────────────────────────────────────────────

  const visitations = (visitationsQuery.data ?? []).filter((v) => {
    if (outcomeFilter !== "all" && v.visitOutcome !== outcomeFilter) return false;
    if (visitSafetyConcernsFilter === "flagged" && !v.safetyConcernsNoted) return false;
    if (visitSafetyConcernsFilter === "clear" && v.safetyConcernsNoted) return false;
    if (visitSearch) {
      const q = visitSearch.toLowerCase();
      if (
        !v.residentDisplayName.toLowerCase().includes(q) &&
        !v.socialWorker.toLowerCase().includes(q) &&
        !v.visitType.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });
  const visitTotalPages = Math.max(1, Math.ceil(visitations.length / ITEMS_PER_PAGE));
  const paginatedVisitations = visitations.slice((visitPage - 1) * ITEMS_PER_PAGE, visitPage * ITEMS_PER_PAGE);

  const allPlans = plansQuery.data ?? [];
  const searchedPlans = planSearch
    ? allPlans.filter((p) => {
        const q = planSearch.toLowerCase();
        return (
          p.residentDisplayName.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          p.planCategory.toLowerCase().includes(q)
        );
      })
    : allPlans;
  const upcomingPlans = searchedPlans
    .filter((p) => !p.caseConferenceDate || p.caseConferenceDate.slice(0, 10) >= today)
    .sort((a, b) => {
      const dateA = a.caseConferenceDate ? new Date(a.caseConferenceDate).getTime() : Infinity;
      const dateB = b.caseConferenceDate ? new Date(b.caseConferenceDate).getTime() : Infinity;
      return dateA - dateB;
    })
    .slice(0, 10);
  const pastPlans = searchedPlans.filter((p) => p.caseConferenceDate && p.caseConferenceDate.slice(0, 10) < today);
  const planTotalPages = Math.max(1, Math.ceil(pastPlans.length / ITEMS_PER_PAGE));
  const paginatedPastPlans = pastPlans.slice((planPage - 1) * ITEMS_PER_PAGE, planPage * ITEMS_PER_PAGE);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminWorkspace items={navigationItems} signOutPending={signOutPending} onSignOut={handleLogout}>

      {/* ── Page Header ── */}
      <div className="border border-border bg-card">
        <div className="px-5 py-5">
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
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Intervention Plans
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Plan Filters */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Search</Label>
              <Input
                placeholder="Search by resident, status, category..."
                className="rounded-none w-full sm:w-[280px]"
                value={planSearch}
                onChange={(e) => { setPlanSearch(e.target.value); setPlanPage(1); }}
              />
            </div>
            <div className="min-w-[220px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Resident</Label>
              <Select value={planResidentFilter} onValueChange={(v) => { setPlanResidentFilter(v); setPlanPage(1); }}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="All Residents" />
                </SelectTrigger>
                <SelectContent side="bottom" avoidCollisions={false} className="max-h-80">
                  <div className="p-2">
                    <Input
                      placeholder="Search residents..."
                      className="rounded-none h-8 text-sm"
                      value={planResidentSearch}
                      onChange={(e) => setPlanResidentSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">All Residents</SelectItem>
                  {(residentsQuery.data ?? [])
                    .filter((r) => {
                      if (!planResidentSearch) return true;
                      const q = planResidentSearch.toLowerCase();
                      const name = r.firstName ? `${r.firstName} ${r.lastName ?? ""}`.toLowerCase() : "";
                      return name.includes(q) || r.internalCode.toLowerCase().includes(q) || r.caseControlNo.toLowerCase().includes(q);
                    })
                    .map((r) => (
                      <SelectItem key={r.residentId} value={String(r.residentId)}>
                        {r.firstName ? `${r.firstName} ${r.lastName ?? ""}`.trim() : `${r.internalCode} — ${r.caseControlNo}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Plan Status</Label>
              <Select value={planStatusFilter} onValueChange={(v) => { setPlanStatusFilter(v); setPlanPage(1); }}>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {PLAN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Upcoming Plans */}
      {plansQuery.isError ? (
        <Card className="rounded-none border border-destructive/20 bg-card shadow-none">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <div className="border-l-4 border-destructive pl-3 text-destructive"><CircleAlert className="h-5 w-5" /></div>
            <p className="text-sm text-muted-foreground">{getErrorMessage(plansQuery.error, t("errors.loadFailed"))}</p>
            <Button type="button" onClick={() => void plansQuery.refetch()}>Try again</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-none border border-border bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
              <CardTitle className="text-lg font-semibold">Upcoming Conferences</CardTitle>
              <Button type="button" size="sm" className="rounded-none" onClick={openCreatePlan}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Plan
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {plansQuery.isLoading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-muted" />)}</div>
              ) : upcomingPlans.length === 0 ? (
                <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">No upcoming conferences scheduled.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Target Date</TableHead>
                        <TableHead>Resident</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingPlans.map((plan) => (
                        <TableRow key={plan.planId} className="cursor-pointer" onClick={() => void openViewPlan(plan)}>
                          <TableCell className="whitespace-nowrap text-sm">{formatDate(plan.targetDate)}</TableCell>
                          <TableCell className="text-sm font-medium">{plan.residentDisplayName}</TableCell>
                          <TableCell className="text-sm">{plan.planCategory}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("rounded-none text-xs", getStatusBadgeClass(plan.status))}>{plan.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void openEditPlan(plan)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeletePlanId(plan.planId)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-none border border-border bg-card shadow-none">
            <CardHeader className="px-5 py-4">
              <CardTitle className="text-lg font-semibold">Conference History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {plansQuery.isLoading ? (
                <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-muted" />)}</div>
              ) : pastPlans.length === 0 ? (
                <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">No past conference records found.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conference Date</TableHead>
                          <TableHead>Resident</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Target Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPastPlans.map((plan) => (
                          <TableRow key={plan.planId} className="cursor-pointer" onClick={() => void openViewPlan(plan)}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {plan.caseConferenceDate ? formatDate(plan.caseConferenceDate) : <span className="italic text-muted-foreground">TBD</span>}
                            </TableCell>
                            <TableCell className="text-sm font-medium">{plan.residentDisplayName}</TableCell>
                            <TableCell className="text-sm">{plan.planCategory}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{formatDate(plan.targetDate)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("rounded-none text-xs", getStatusBadgeClass(plan.status))}>{plan.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1">
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void openEditPlan(plan)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeletePlanId(plan.planId)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {planTotalPages > 1 && (
                    <div className="flex items-center justify-end gap-4 border-t border-border px-4 py-3">
                      <Button type="button" variant="outline" size="sm" className="rounded-none" disabled={planPage === 1} onClick={() => setPlanPage((p) => p - 1)}>Previous</Button>
                      <span className="text-sm text-muted-foreground">Page {planPage} of {planTotalPages}</span>
                      <Button type="button" variant="outline" size="sm" className="rounded-none" disabled={planPage === planTotalPages} onClick={() => setPlanPage((p) => p + 1)}>Next</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Home Visits
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Visit Filters */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Search
              </Label>
              <Input
                placeholder="Search by resident, social worker, type..."
                className="rounded-none w-full sm:w-[280px]"
                value={visitSearch}
                onChange={(e) => { setVisitSearch(e.target.value); setVisitPage(1); }}
              />
            </div>
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
                <SelectContent side="bottom">
                  <div className="p-2">
                    <Input
                      placeholder="Search residents..."
                      className="rounded-none h-8 text-sm"
                      value={filterResidentSearch}
                      onChange={(e) => setFilterResidentSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  <SelectItem value="all">{t("filters.allResidents")}</SelectItem>
                  {(residentsQuery.data ?? [])
                    .filter((r) => {
                      if (!filterResidentSearch) return true;
                      const q = filterResidentSearch.toLowerCase();
                      const name = r.firstName ? `${r.firstName} ${r.lastName ?? ""}`.toLowerCase() : "";
                      return name.includes(q) || r.internalCode.toLowerCase().includes(q) || r.caseControlNo.toLowerCase().includes(q);
                    })
                    .map((r) => (
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
                  {OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Safety Concerns
              </Label>
              <div className="flex h-10 rounded-none border border-input overflow-hidden">
                {(["all", "flagged", "clear"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setVisitSafetyConcernsFilter(val); setVisitPage(1); }}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                      visitSafetyConcernsFilter === val
                        ? val === "flagged"
                          ? "bg-destructive/70 text-destructive-foreground"
                          : "bg-primary/70 text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {val === "all" ? "All" : val === "flagged" ? "Flagged" : "Clear"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Table */}
      {visitationsQuery.isError ? (
        <Card className="rounded-none border border-destructive/20 bg-card shadow-none">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <div className="border-l-4 border-destructive pl-3 text-destructive"><CircleAlert className="h-5 w-5" /></div>
            <p className="text-sm text-muted-foreground">{getErrorMessage(visitationsQuery.error, t("errors.loadFailed"))}</p>
            <Button type="button" onClick={() => void visitationsQuery.refetch()}>Try again</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-none border border-border bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
            <CardTitle className="text-lg font-semibold">Visitation Log</CardTitle>
            <Button type="button" size="sm" className="rounded-none" onClick={openCreateVisit}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("actions.newVisit")}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {visitationsQuery.isLoading ? (
              <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse bg-muted" />)}</div>
            ) : visitations.length === 0 ? (
              <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">{t("table.noRecords")}</div>
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
                        <TableRow key={visit.visitationId} className="cursor-pointer" onClick={() => void openViewVisit(visit)}>
                          <TableCell className="whitespace-nowrap text-sm">{formatDate(visit.visitDate)}</TableCell>
                          <TableCell className="text-sm font-medium">{visit.residentDisplayName}</TableCell>
                          <TableCell className="text-sm">{visit.socialWorker}</TableCell>
                          <TableCell className="text-sm">{visit.visitType}</TableCell>
                          <TableCell className="text-sm">{visit.familyCooperationLevel}</TableCell>
                          <TableCell>
                            {visit.safetyConcernsNoted ? (
                              <Badge variant="outline" className="rounded-none border-0 bg-destructive/10 text-destructive text-xs">Yes</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn("rounded-none text-xs", getOutcomeBadgeClass(visit.visitOutcome))}>
                              {visit.visitOutcome}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                {visitTotalPages > 1 && (
                  <div className="flex items-center justify-end gap-4 border-t border-border px-4 py-3">
                    <Button type="button" variant="outline" size="sm" className="rounded-none" disabled={visitPage === 1} onClick={() => setVisitPage((p) => p - 1)}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {visitPage} of {visitTotalPages}</span>
                    <Button type="button" variant="outline" size="sm" className="rounded-none" disabled={visitPage === visitTotalPages} onClick={() => setVisitPage((p) => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOGS — Home Visits
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Visit View Dialog */}
      <Dialog open={viewVisitDialogOpen} onOpenChange={setViewVisitDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-border bg-card p-0 shadow-xl sm:max-w-[700px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>Visit Details</DialogTitle>
          </DialogHeader>
          {!viewVisitDetail ? (
            <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 animate-pulse bg-muted" />)}</div>
          ) : (
            <div className="px-6 py-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Resident</p><p className="text-sm font-medium">{viewVisitDetail.residentDisplayName}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Visit Date</p><p className="text-sm">{formatDate(viewVisitDetail.visitDate)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Social Worker</p><p className="text-sm">{viewVisitDetail.socialWorker}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Visit Type</p><p className="text-sm">{viewVisitDetail.visitType}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Location</p><p className="text-sm">{viewVisitDetail.locationVisited || "—"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Family Members Present</p><p className="text-sm">{viewVisitDetail.familyMembersPresent || "—"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Family Cooperation</p><p className="text-sm">{viewVisitDetail.familyCooperationLevel}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Outcome</p><Badge variant="outline" className={cn("rounded-none text-xs", getOutcomeBadgeClass(viewVisitDetail.visitOutcome))}>{viewVisitDetail.visitOutcome}</Badge></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Safety Concerns</p>{viewVisitDetail.safetyConcernsNoted ? <Badge variant="outline" className="rounded-none border-0 bg-destructive/10 text-destructive text-xs">Yes</Badge> : <p className="text-sm text-muted-foreground">None noted</p>}</div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Follow-Up Needed</p><p className="text-sm">{viewVisitDetail.followUpNeeded ? "Yes" : "No"}</p></div>
              </div>
              <div className="border-t border-border pt-4 space-y-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Purpose</p><p className="text-sm whitespace-pre-wrap">{viewVisitDetail.purpose || "—"}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Observations</p><p className="text-sm whitespace-pre-wrap">{viewVisitDetail.observations || "—"}</p></div>
                {viewVisitDetail.followUpNotes && <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Follow-Up Notes</p><p className="text-sm whitespace-pre-wrap">{viewVisitDetail.followUpNotes}</p></div>}
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" className="rounded-none" onClick={() => setViewVisitDialogOpen(false)}>Close</Button>
                <Button type="button" className="rounded-none" onClick={() => { setViewVisitDialogOpen(false); const card = visitationsQuery.data?.find((v) => v.visitationId === viewVisitDetail.visitationId); if (card) void openEditVisit(card); }}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Visit Create/Edit Dialog */}
      <Dialog open={visitDialogOpen} onOpenChange={setVisitDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-border bg-card p-0 shadow-xl sm:max-w-[800px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>{editingVisitId ? t("dialog.editTitle") : t("dialog.createTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); upsertVisitMutation.mutate({ id: editingVisitId, body: visitForm }); }}>
            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <Field label={t("dialog.resident")}>
                <Select value={visitForm.residentId ? String(visitForm.residentId) : ""} onValueChange={(v) => setVisitForm((f) => ({ ...f, residentId: Number(v) }))}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Select resident" /></SelectTrigger>
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
                <Input type="date" className="rounded-none" value={visitForm.visitDate} onChange={(e) => setVisitForm((f) => ({ ...f, visitDate: e.target.value }))} required />
              </Field>
              <Field label={t("dialog.socialWorker")}>
                <Input className="rounded-none" value={visitForm.socialWorker} onChange={(e) => setVisitForm((f) => ({ ...f, socialWorker: e.target.value }))} required />
              </Field>
              <Field label={t("dialog.visitType")}>
                <Select value={visitForm.visitType} onValueChange={(v) => setVisitForm((f) => ({ ...f, visitType: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{VISIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("dialog.locationVisited")}>
                <Input className="rounded-none" value={visitForm.locationVisited} onChange={(e) => setVisitForm((f) => ({ ...f, locationVisited: e.target.value }))} />
              </Field>
              <Field label={t("dialog.familyMembersPresent")}>
                <Input className="rounded-none" value={visitForm.familyMembersPresent} onChange={(e) => setVisitForm((f) => ({ ...f, familyMembersPresent: e.target.value }))} />
              </Field>
              <div className="sm:col-span-2">
                <Field label={t("dialog.purpose")}>
                  <textarea className="min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm" value={visitForm.purpose} onChange={(e) => setVisitForm((f) => ({ ...f, purpose: e.target.value }))} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label={t("dialog.observations")}>
                  <textarea className="min-h-[100px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm" value={visitForm.observations} onChange={(e) => setVisitForm((f) => ({ ...f, observations: e.target.value }))} />
                </Field>
              </div>
              <Field label={t("dialog.familyCooperationLevel")}>
                <Select value={visitForm.familyCooperationLevel} onValueChange={(v) => setVisitForm((f) => ({ ...f, familyCooperationLevel: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{COOPERATION_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label={t("dialog.visitOutcome")}>
                <Select value={visitForm.visitOutcome} onValueChange={(v) => setVisitForm((f) => ({ ...f, visitOutcome: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{OUTCOMES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <div className="flex items-center gap-3">
                <Switch
                  id="safetyConcernsNoted"
                  checked={visitForm.safetyConcernsNoted}
                  onCheckedChange={(checked) => setVisitForm((f) => ({ ...f, safetyConcernsNoted: checked }))}
                />
                <Label htmlFor="safetyConcernsNoted" className="cursor-pointer">{t("dialog.safetyConcernsNoted")}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="followUpNeeded"
                  checked={visitForm.followUpNeeded}
                  onCheckedChange={(checked) => setVisitForm((f) => ({ ...f, followUpNeeded: checked }))}
                />
                <Label htmlFor="followUpNeeded" className="cursor-pointer">{t("dialog.followUpNeeded")}</Label>
              </div>
              {visitForm.followUpNeeded && (
                <div className="sm:col-span-2">
                  <Field label={t("dialog.followUpNotes")}>
                    <textarea className="min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm" value={visitForm.followUpNotes} onChange={(e) => setVisitForm((f) => ({ ...f, followUpNotes: e.target.value }))} />
                  </Field>
                </div>
              )}
            </div>
            {visitSaveError && <div className="mx-6 mb-4 rounded-none border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{visitSaveError}</div>}
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" className="rounded-none" onClick={() => setVisitDialogOpen(false)}>{t("actions.cancel")}</Button>
              <Button type="submit" className="rounded-none" disabled={upsertVisitMutation.isPending}>{upsertVisitMutation.isPending ? "Saving…" : t("actions.save")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Visit Delete Dialog */}
      <AlertDialog open={deleteVisitId !== null} onOpenChange={(open) => !open && setDeleteVisitId(null)}>
        <AlertDialogContent className="rounded-none border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteDialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteVisitId !== null && deleteVisitMutation.mutate(deleteVisitId)} disabled={deleteVisitMutation.isPending}>
              {deleteVisitMutation.isPending ? "Deleting…" : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════════════════════════════════════
          DIALOGS — Intervention Plans
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Plan View Dialog */}
      <Dialog open={viewPlanDialogOpen} onOpenChange={setViewPlanDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-border bg-card p-0 shadow-xl sm:max-w-[700px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>Conference Details</DialogTitle>
          </DialogHeader>
          {!viewPlanDetail ? (
            <div className="space-y-3 p-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-8 animate-pulse bg-muted" />)}</div>
          ) : (
            <div className="px-6 py-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Resident</p><p className="text-sm font-medium">{viewPlanDetail.residentDisplayName}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Category</p><p className="text-sm">{viewPlanDetail.planCategory}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Status</p><Badge variant="outline" className={cn("rounded-none text-xs", getStatusBadgeClass(viewPlanDetail.status))}>{viewPlanDetail.status}</Badge></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Conference Date</p><p className="text-sm">{viewPlanDetail.caseConferenceDate ? formatDate(viewPlanDetail.caseConferenceDate) : <span className="italic text-muted-foreground">TBD</span>}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Target Date</p><p className="text-sm">{formatDate(viewPlanDetail.targetDate)}</p></div>
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Target Value</p><p className="text-sm">{viewPlanDetail.targetValue}</p></div>
              </div>
              {viewPlanDetail.planDescription && <div className="border-t border-border pt-4"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Plan Description</p><p className="text-sm whitespace-pre-wrap">{viewPlanDetail.planDescription}</p></div>}
              {viewPlanDetail.servicesProvided && <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Services Provided</p><p className="text-sm whitespace-pre-wrap">{viewPlanDetail.servicesProvided}</p></div>}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" className="rounded-none" onClick={() => setViewPlanDialogOpen(false)}>Close</Button>
                <Button type="button" className="rounded-none" onClick={() => { setViewPlanDialogOpen(false); const card = plansQuery.data?.find((p) => p.planId === viewPlanDetail.planId); if (card) void openEditPlan(card); }}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Plan Create/Edit Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-border bg-card p-0 shadow-xl sm:max-w-[700px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>{editingPlanId ? "Edit Intervention Plan" : "New Intervention Plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); upsertPlanMutation.mutate({ id: editingPlanId, body: planForm }); }}>
            <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <Field label="Resident">
                <Select value={planForm.residentId ? String(planForm.residentId) : ""} onValueChange={(v) => setPlanForm((f) => ({ ...f, residentId: Number(v) }))}>
                  <SelectTrigger className="rounded-none"><SelectValue placeholder="Select resident" /></SelectTrigger>
                  <SelectContent>
                    {(residentsQuery.data ?? []).map((r) => (
                      <SelectItem key={r.residentId} value={String(r.residentId)}>
                        {r.firstName ? `${r.firstName} ${r.lastName ?? ""}`.trim() : `${r.internalCode} — ${r.caseControlNo}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Plan Category">
                <Select value={planForm.planCategory} onValueChange={(v) => setPlanForm((f) => ({ ...f, planCategory: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLAN_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={planForm.status} onValueChange={(v) => setPlanForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLAN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Conference Date (optional)">
                <Input type="date" className="rounded-none" value={planForm.caseConferenceDate} onChange={(e) => setPlanForm((f) => ({ ...f, caseConferenceDate: e.target.value }))} />
              </Field>
              <Field label="Target Date">
                <Input type="date" className="rounded-none" value={planForm.targetDate} onChange={(e) => setPlanForm((f) => ({ ...f, targetDate: e.target.value }))} required />
              </Field>
              <Field label="Target Value">
                <Input type="number" min="0" step="0.01" className="rounded-none" value={planForm.targetValue} onChange={(e) => setPlanForm((f) => ({ ...f, targetValue: e.target.value }))} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Plan Description">
                  <textarea className="min-h-[100px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm" placeholder="Describe the plan, goals, and conference discussion..." value={planForm.planDescription} onChange={(e) => setPlanForm((f) => ({ ...f, planDescription: e.target.value }))} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Services Provided">
                  <textarea className="min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm" placeholder="List services discussed or arranged..." value={planForm.servicesProvided} onChange={(e) => setPlanForm((f) => ({ ...f, servicesProvided: e.target.value }))} />
                </Field>
              </div>
            </div>
            {planSaveError && <div className="mx-6 mb-4 rounded-none border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{planSaveError}</div>}
            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" className="rounded-none" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="rounded-none" disabled={upsertPlanMutation.isPending || !planForm.residentId}>{upsertPlanMutation.isPending ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Plan Delete Dialog */}
      <AlertDialog open={deletePlanId !== null} onOpenChange={(open) => !open && setDeletePlanId(null)}>
        <AlertDialogContent className="rounded-none border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conference Record</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The intervention plan and conference record will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deletePlanId !== null && deletePlanMutation.mutate(deletePlanId)} disabled={deletePlanMutation.isPending}>
              {deletePlanMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </AdminWorkspace>
  );
};

export default HomeVisitation;
