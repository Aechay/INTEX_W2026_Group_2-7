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

type ResidentOption = {
  residentId: number;
  internalCode: string;
  caseControlNo: string;
  firstName?: string | null;
  lastName?: string | null;
};

type ProcessRecordingDetail = {
  recordingId: number;
  residentId: number;
  residentDisplayName: string;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  sessionDurationMinutes: number;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  sessionNarrative: string;
  interventionsApplied: string;
  followUpActions: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
  notesRestricted: string | null;
};

type ProcessRecordingCard = {
  recordingId: number;
  residentId: number;
  residentDisplayName: string;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
};

type ProcessRecordingUpsertForm = {
  residentId: number;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  sessionDurationMinutes: number;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  sessionNarrative: string;
  interventionsApplied: string;
  followUpActions: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
  notesRestricted: string;
};

const EMOTIONAL_STATES = [
  "Calm",
  "Anxious",
  "Sad",
  "Angry",
  "Happy",
  "Confused",
  "Fearful",
  "Hopeful",
  "Withdrawn",
  "Engaged",
];

const SESSION_TYPES = ["Individual", "Group"];

const ITEMS_PER_PAGE = 10;

const emptyForm = (): ProcessRecordingUpsertForm => ({
  residentId: 0,
  sessionDate: new Date().toISOString().slice(0, 10),
  socialWorker: "",
  sessionType: "Individual",
  sessionDurationMinutes: 60,
  emotionalStateObserved: "",
  emotionalStateEnd: "",
  sessionNarrative: "",
  interventionsApplied: "",
  followUpActions: "",
  progressNoted: false,
  concernsFlagged: false,
  referralMade: false,
  notesRestricted: "",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

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

const ProcessRecording = () => {
  const auth = useAuth();
  const { i18n, t } = useTranslation("processRecording");
  const queryClient = useQueryClient();
  const [signOutPending, setSignOutPending] = useState(false);
  const [residentFilter, setResidentFilter] = useState("all");
  const [socialWorkerFilter, setSocialWorkerFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProcessRecordingUpsertForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [viewDetail, setViewDetail] = useState<ProcessRecordingDetail | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [residentSearch, setResidentSearch] = useState("");
  const [filterResidentSearch, setFilterResidentSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [concernsFilter, setConcernsFilter] = useState<"all" | "flagged" | "clear">("all");
  const [progressFilter, setProgressFilter] = useState<"all" | "yes" | "no">("all");
  const [upcomingPage, setUpcomingPage] = useState(1);

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
    { label: t("sidebar.processRecording"), icon: ClipboardList, to: processRecordingPath, active: true },
    { label: t("sidebar.caseConferences"), icon: CalendarClock, to: homeVisitationPath },
    { label: t("sidebar.reports"), icon: FileBarChart2, to: reportsPath },
  ];

  const residentsQuery = useQuery({
    queryKey: ["admin-caseload-residents"],
    queryFn: () =>
      auth.authenticatedJson<{ residents: ResidentOption[] }>("/api/admin/caseload/residents"),
    select: (data) => data.residents,
  });

  const socialWorkersQuery = useQuery({
    queryKey: ["admin-process-recording-social-workers"],
    queryFn: () =>
      auth.authenticatedJson<string[]>("/api/admin/process-recordings/social-workers"),
  });

  const recordingsQuery = useQuery({
    queryKey: ["admin-process-recordings", residentFilter, socialWorkerFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (residentFilter !== "all") params.set("residentId", residentFilter);
      if (socialWorkerFilter !== "all") params.set("socialWorker", socialWorkerFilter);
      const qs = params.toString();
      return auth.authenticatedJson<ProcessRecordingCard[]>(`/api/admin/process-recordings${qs ? `?${qs}` : ""}`);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number | null; body: ProcessRecordingUpsertForm }) => {
      const payload = {
        ...body,
        sessionDate: body.sessionDate,
        notesRestricted: body.notesRestricted.trim() || null,
      };
      if (id) {
        return auth.authenticatedJson<ProcessRecordingCard>(`/api/admin/process-recordings/${id}`, {
          method: "PUT",
          body: payload,
        });
      }
      return auth.authenticatedJson<ProcessRecordingCard>("/api/admin/process-recordings", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-process-recordings"] });
      setDialogOpen(false);
      setSaveError(null);
    },
    onError: (error) => {
      setSaveError(getErrorMessage(error, t("errors.saveFailed")));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      auth.authenticatedJson(`/api/admin/process-recordings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-process-recordings"] });
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
    setResidentSearch("");
    setDialogOpen(true);
  };

  const openEdit = async (recording: ProcessRecordingCard) => {
    setEditingId(recording.recordingId);
    setSaveError(null);
    setResidentSearch("");
    setForm({
      residentId: recording.residentId,
      sessionDate: recording.sessionDate.slice(0, 10),
      socialWorker: recording.socialWorker,
      sessionType: recording.sessionType,
      sessionDurationMinutes: 60,
      emotionalStateObserved: recording.emotionalStateObserved,
      emotionalStateEnd: recording.emotionalStateEnd,
      sessionNarrative: "",
      interventionsApplied: "",
      followUpActions: "",
      progressNoted: recording.progressNoted,
      concernsFlagged: recording.concernsFlagged,
      referralMade: recording.referralMade,
      notesRestricted: "",
    });
    setDialogOpen(true);
    try {
      const detail = await auth.authenticatedJson<ProcessRecordingDetail>(
        `/api/admin/process-recordings/${recording.recordingId}`,
      );
      setForm((f) => ({
        ...f,
        sessionDurationMinutes: detail.sessionDurationMinutes,
        sessionNarrative: detail.sessionNarrative,
        interventionsApplied: detail.interventionsApplied,
        followUpActions: detail.followUpActions,
        notesRestricted: detail.notesRestricted ?? "",
      }));
    } catch {
      // Non-critical: basic fields already populated from card data
    }
  };

  const openView = async (recording: ProcessRecordingCard) => {
    setViewDetail(null);
    setViewDialogOpen(true);
    try {
      const detail = await auth.authenticatedJson<ProcessRecordingDetail>(
        `/api/admin/process-recordings/${recording.recordingId}`,
      );
      setViewDetail(detail);
    } catch {
      setViewDialogOpen(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    upsertMutation.mutate({ id: editingId, body: form });
  };

  const recordings = recordingsQuery.data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const searchedRecordings = recordings.filter((r) => {
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      if (
        !r.residentDisplayName.toLowerCase().includes(q) &&
        !r.socialWorker.toLowerCase().includes(q) &&
        !r.sessionType.toLowerCase().includes(q)
      ) return false;
    }
    if (concernsFilter === "flagged" && !r.concernsFlagged) return false;
    if (concernsFilter === "clear" && r.concernsFlagged) return false;
    if (progressFilter === "yes" && !r.progressNoted) return false;
    if (progressFilter === "no" && r.progressNoted) return false;
    return true;
  });
  const upcomingSessions = searchedRecordings
    .filter((r) => r.sessionDate.slice(0, 10) > today)
    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingSessions.length / ITEMS_PER_PAGE));
  const paginatedUpcoming = upcomingSessions.slice(
    (upcomingPage - 1) * ITEMS_PER_PAGE,
    upcomingPage * ITEMS_PER_PAGE,
  );
  const pastRecordings = searchedRecordings.filter((r) => r.sessionDate.slice(0, 10) <= today);
  const totalPages = Math.max(1, Math.ceil(pastRecordings.length / ITEMS_PER_PAGE));
  const paginatedRecordings = pastRecordings.slice(
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
        <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
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
          <Button
            type="button"
            className="w-fit"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("actions.newRecording")}
          </Button>
        </div>
      </div>

      {/* Filters */}
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
                value={tableSearch}
                onChange={(e) => { setTableSearch(e.target.value); setCurrentPage(1); setUpcomingPage(1); }}
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
                <SelectContent side="bottom" avoidCollisions={false}>
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
            <div className="min-w-[220px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("filters.socialWorker")}
              </Label>
              <Select
                value={socialWorkerFilter}
                onValueChange={(value) => {
                  setSocialWorkerFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="rounded-none" aria-label={t("filters.socialWorker")}>
                  <SelectValue placeholder={t("filters.allSocialWorkers")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allSocialWorkers")}</SelectItem>
                  {(socialWorkersQuery.data ?? []).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Concerns
              </Label>
              <div className="flex h-10 rounded-none border border-input overflow-hidden">
                {(["all", "flagged", "clear"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setConcernsFilter(val); setCurrentPage(1); setUpcomingPage(1); }}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                      concernsFilter === val
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
            <div className="min-w-[180px] space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Progress
              </Label>
              <div className="flex h-10 rounded-none border border-input overflow-hidden">
                {(["all", "yes", "no"] as const).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setProgressFilter(val); setCurrentPage(1); setUpcomingPage(1); }}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                      progressFilter === val
                        ? "bg-primary/70 text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {val === "all" ? "All" : val === "yes" ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-lg font-semibold">Upcoming Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recordingsQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse bg-muted" />
              ))}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">
              No upcoming sessions scheduled.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.sessionDate")}</TableHead>
                    <TableHead>{t("table.resident")}</TableHead>
                    <TableHead>{t("table.socialWorker")}</TableHead>
                    <TableHead>{t("table.sessionType")}</TableHead>
                    <TableHead>{t("table.emotionalState")}</TableHead>
                    <TableHead>{t("table.progress")}</TableHead>
                    <TableHead>{t("table.concerns")}</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUpcoming.map((rec) => (
                    <TableRow key={rec.recordingId} className="cursor-pointer" onClick={() => void openView(rec)}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(rec.sessionDate)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {rec.residentDisplayName}
                      </TableCell>
                      <TableCell className="text-sm">{rec.socialWorker}</TableCell>
                      <TableCell className="text-sm">{rec.sessionType}</TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{rec.emotionalStateObserved}</span>
                        {" → "}
                        <span>{rec.emotionalStateEnd}</span>
                      </TableCell>
                      <TableCell>
                        {rec.progressNoted ? (
                          <Badge variant="outline" className="rounded-none border-0 bg-primary/10 text-primary text-xs">
                            Yes
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {rec.concernsFlagged ? (
                          <Badge variant="outline" className="rounded-none border-0 bg-destructive/10 text-destructive text-xs">
                            Flagged
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(rec)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(rec.recordingId)}
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
          )}
          {upcomingTotalPages > 1 && (
            <div className="flex items-center justify-end gap-4 border-t border-border px-4 py-3">
              <Button type="button" variant="outline" size="sm" className="rounded-none" disabled={upcomingPage === 1} onClick={() => setUpcomingPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {upcomingPage} of {upcomingTotalPages}</span>
              <Button type="button" variant="outline" size="sm" className="rounded-none" disabled={upcomingPage === upcomingTotalPages} onClick={() => setUpcomingPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {recordingsQuery.isError ? (
        <Card className="rounded-none border border-destructive/20 bg-card shadow-none">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <div className="border-l-4 border-destructive/50 pl-3 text-destructive/70">
              <CircleAlert className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(recordingsQuery.error, t("errors.loadFailed"))}
            </p>
            <Button type="button" onClick={() => void recordingsQuery.refetch()}>
              {t("actions.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-none border border-border bg-card shadow-none">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-lg font-semibold">
              Session History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recordingsQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse bg-muted" />
                ))}
              </div>
            ) : pastRecordings.length === 0 ? (
              <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">
                {t("table.noRecords")}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table.sessionDate")}</TableHead>
                        <TableHead>{t("table.resident")}</TableHead>
                        <TableHead>{t("table.socialWorker")}</TableHead>
                        <TableHead>{t("table.sessionType")}</TableHead>
                        <TableHead>{t("table.emotionalState")}</TableHead>
                          <TableHead>{t("table.progress")}</TableHead>
                          <TableHead>{t("table.concerns")}</TableHead>
                          <TableHead className="text-right">{t("table.actions")}</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {paginatedRecordings.map((rec) => (
                        <TableRow key={rec.recordingId} className="cursor-pointer" onClick={() => void openView(rec)}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDate(rec.sessionDate)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {rec.residentDisplayName}
                          </TableCell>
                          <TableCell className="text-sm">{rec.socialWorker}</TableCell>
                          <TableCell className="text-sm">{rec.sessionType}</TableCell>
                          <TableCell className="text-sm">
                            <span className="text-muted-foreground">
                              {rec.emotionalStateObserved}
                            </span>
                            {" → "}
                            <span>{rec.emotionalStateEnd}</span>
                          </TableCell>
                          <TableCell>
                            {rec.progressNoted ? (
                              <Badge variant="outline" className="rounded-none border-0 bg-primary/10 text-primary text-xs">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {rec.concernsFlagged ? (
                              <Badge variant="outline" className="rounded-none border-0 bg-destructive/10 text-destructive text-xs">
                                Flagged
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEdit(rec)}
                                aria-label={t("table.editRecording")}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(rec.recordingId)}
                                aria-label={t("table.deleteRecording")}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-4 border-t border-border px-4 py-3">
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

      {/* View Detail Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-border bg-card p-0 shadow-xl sm:max-w-[700px]">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          {!viewDetail ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 animate-pulse bg-muted" />
              ))}
            </div>
          ) : (
            <div className="px-6 py-5 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Resident</p>
                  <p className="text-sm font-medium">{viewDetail.residentDisplayName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Session Date</p>
                  <p className="text-sm">{formatDate(viewDetail.sessionDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Social Worker</p>
                  <p className="text-sm">{viewDetail.socialWorker}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Session Type</p>
                  <p className="text-sm">{viewDetail.sessionType}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm">{viewDetail.sessionDurationMinutes} minutes</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Emotional State</p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">{viewDetail.emotionalStateObserved}</span>
                    {" → "}
                    <span>{viewDetail.emotionalStateEnd}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Progress Noted</p>
                  {viewDetail.progressNoted ? (
                    <Badge variant="outline" className="rounded-none border-0 bg-primary/10 text-primary text-xs">Yes</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">No</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Concerns Flagged</p>
                  {viewDetail.concernsFlagged ? (
                    <Badge variant="outline" className="rounded-none border-0 bg-destructive/10 text-destructive text-xs">Flagged</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">No</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Referral Made</p>
                  <p className="text-sm">{viewDetail.referralMade ? "Yes" : "No"}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Session Narrative</p>
                  <p className="text-sm whitespace-pre-wrap text-foreground">{viewDetail.sessionNarrative || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Interventions Applied</p>
                  <p className="text-sm whitespace-pre-wrap text-foreground">{viewDetail.interventionsApplied || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-1">Follow-Up Actions</p>
                  <p className="text-sm whitespace-pre-wrap text-foreground">{viewDetail.followUpActions || "—"}</p>
                </div>
                {viewDetail.notesRestricted && (
                  <div className="rounded-none border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-destructive mb-1">Restricted Notes</p>
                    <p className="text-sm whitespace-pre-wrap text-foreground">{viewDetail.notesRestricted}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  onClick={() => setViewDialogOpen(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  className="rounded-none"
                  onClick={() => {
                    setViewDialogOpen(false);
                    const card = recordingsQuery.data?.find((r) => r.recordingId === viewDetail.recordingId);
                    if (card) void openEdit(card);
                  }}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  <SelectTrigger className="rounded-none" aria-label={t("dialog.resident")}>
                    <SelectValue placeholder={t("dialog.selectResident")} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search residents..."
                        className="rounded-none h-8 text-sm"
                        value={residentSearch}
                        onChange={(e) => setResidentSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    {(residentsQuery.data ?? [])
                      .filter((r) => {
                        if (!residentSearch) return true;
                        const q = residentSearch.toLowerCase();
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
              </Field>

              <Field label={t("dialog.sessionDate")}>
                <Input
                  type="date"
                  className="rounded-none"
                  value={form.sessionDate}
                  onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
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

              <Field label={t("dialog.sessionType")}>
                <Select
                  value={form.sessionType}
                  onValueChange={(value) => setForm((f) => ({ ...f, sessionType: value }))}
                >
                  <SelectTrigger className="rounded-none" aria-label={t("dialog.sessionType")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("dialog.sessionDuration")}>
                <Input
                  type="number"
                  className="rounded-none"
                  min={1}
                  value={form.sessionDurationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, sessionDurationMinutes: Number(e.target.value) }))}
                  required
                />
              </Field>

              <Field label={t("dialog.emotionalStateObserved")}>
                <Select
                  value={form.emotionalStateObserved}
                  onValueChange={(value) => setForm((f) => ({ ...f, emotionalStateObserved: value }))}
                >
                  <SelectTrigger className="rounded-none" aria-label={t("dialog.emotionalStateObserved")}>
                    <SelectValue placeholder={t("dialog.selectState")} />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONAL_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("dialog.emotionalStateEnd")}>
                <Select
                  value={form.emotionalStateEnd}
                  onValueChange={(value) => setForm((f) => ({ ...f, emotionalStateEnd: value }))}
                >
                  <SelectTrigger className="rounded-none" aria-label={t("dialog.emotionalStateEnd")}>
                    <SelectValue placeholder={t("dialog.selectState")} />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONAL_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="sm:col-span-2">
                <Field label={t("dialog.sessionNarrative")}>
                  <textarea
                    className="min-h-[100px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                    value={form.sessionNarrative}
                    onChange={(e) => setForm((f) => ({ ...f, sessionNarrative: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label={t("dialog.interventionsApplied")}>
                  <textarea
                    className="min-h-[100px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                    value={form.interventionsApplied}
                    onChange={(e) => setForm((f) => ({ ...f, interventionsApplied: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label={t("dialog.followUpActions")}>
                  <textarea
                    className="min-h-[100px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                    value={form.followUpActions}
                    onChange={(e) => setForm((f) => ({ ...f, followUpActions: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="progressNoted"
                  checked={form.progressNoted}
                  onChange={(e) => setForm((f) => ({ ...f, progressNoted: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="progressNoted">{t("dialog.progressNoted")}</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="concernsFlagged"
                  checked={form.concernsFlagged}
                  onChange={(e) => setForm((f) => ({ ...f, concernsFlagged: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="concernsFlagged">{t("dialog.concernsFlagged")}</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="referralMade"
                  checked={form.referralMade}
                  onChange={(e) => setForm((f) => ({ ...f, referralMade: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="referralMade">{t("dialog.referralMade")}</Label>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  {t("dialog.notesRestricted")}
                </Label>
                <p className="text-xs text-muted-foreground">{t("dialog.notesRestrictedWarning")}</p>
                <textarea
                  className="min-h-[80px] w-full rounded-none border border-input bg-background px-3 py-2 text-sm"
                  value={form.notesRestricted}
                  onChange={(e) => setForm((f) => ({ ...f, notesRestricted: e.target.value }))}
                />
              </div>
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
                {upsertMutation.isPending ? t("actions.saving") : t("actions.save")}
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
              className="rounded-none bg-destructive/75 text-destructive-foreground hover:bg-destructive/60"
              onClick={() => deleteId !== null && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("deleteDialog.deleting") : t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  );
};

export default ProcessRecording;
