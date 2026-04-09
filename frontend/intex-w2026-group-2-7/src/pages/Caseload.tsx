import { useMemo, useState, type ReactNode } from "react";
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
  Plus,
  Save,
  Search,
  Settings,
  UsersRound,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import AdminWorkspace, { type AdminNavItem } from "@/components/admin/AdminWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { withPathLanguage } from "@/i18n/routing";

type SafehouseOption = {
  safehouseId: number;
  name: string;
};

type Resident = {
  residentId: number;
  internalCode: string;
  caseControlNo: string;
  firstName: string | null;
  lastName: string | null;
  caseStatus: string;
  safehouseId: number;
  safehouseName: string;
  sex: string;
  dateOfBirth: string;
  placeOfBirth: string;
  religion: string;
  caseCategory: string;
  subCatOrphaned: boolean;
  subCatTrafficked: boolean;
  subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean;
  subCatSexualAbuse: boolean;
  subCatOsaec: boolean;
  subCatCicl: boolean;
  subCatAtRisk: boolean;
  subCatStreetChild: boolean;
  subCatChildWithHiv: boolean;
  isPwd: boolean;
  pwdType: string | null;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis: string | null;
  familyIs4Ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  dateOfAdmission: string;
  ageUponAdmission: string;
  presentAge: string;
  lengthOfStay: string;
  referralSource: string;
  referringAgencyPerson: string | null;
  dateColbRegistered: string | null;
  dateColbObtained: string | null;
  assignedSocialWorker: string;
  initialCaseAssessment: string;
  dateCaseStudyPrepared: string | null;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
  initialRiskLevel: string;
  currentRiskLevel: string;
  dateEnrolled: string;
  dateClosed: string | null;
  notesRestricted: string | null;
};

type CaseloadResponse = {
  residents: Resident[];
  safehouses: SafehouseOption[];
  /** Distinct non-empty case categories in the operational database (for dropdowns). */
  caseCategoryOptions: string[];
  filterOptions: {
    caseStatuses: string[];
    caseCategories: string[];
    assignedSocialWorkers: string[];
    reintegrationStatuses: string[];
  };
};

type ResidentForm = Omit<Resident, "residentId" | "safehouseName">;

const dateInputValue = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

/** Matches codes like LS-0001 … LS-0060 (case-insensitive prefix). */
const INTERNAL_CODE_LS_PATTERN = /^LS-(\d+)$/i;

/** Next sequential internal code after the highest existing `LS-####` value. */
function computeNextLsInternalCode(existingCodes: readonly string[]): string {
  let max = 0;
  for (const code of existingCodes) {
    const match = INTERNAL_CODE_LS_PATTERN.exec(code.trim());
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (!Number.isNaN(n) && n > max) {
        max = n;
      }
    }
  }
  return `LS-${String(max + 1).padStart(4, "0")}`;
}

const subCategoryKeys = [
  "subCatOrphaned",
  "subCatTrafficked",
  "subCatChildLabor",
  "subCatPhysicalAbuse",
  "subCatSexualAbuse",
  "subCatOsaec",
  "subCatCicl",
  "subCatAtRisk",
  "subCatStreetChild",
  "subCatChildWithHiv",
] as const;

const familyProfileKeys = [
  "familyIs4Ps",
  "familySoloParent",
  "familyIndigenous",
  "familyParentPwd",
  "familyInformalSettler",
] as const;

/** Empty string is invalid for `DateTime?` in the API — use null for unset optional dates. */
function optionalDateIso(iso: string | null | undefined): string | null {
  const s = dateInputValue(iso ?? null);
  return s || null;
}

/** Request body must match API: exclude UI-only fields like `safehouseName` and `residentId`. */
function buildResidentUpsertPayload(form: ResidentForm): Record<string, unknown> {
  const raw = form as ResidentForm & { safehouseName?: string; residentId?: number };
  const { safehouseName: _s, residentId: _r, ...rest } = raw;
  return {
    ...rest,
    dateOfBirth: dateInputValue(rest.dateOfBirth) || null,
    dateOfAdmission: dateInputValue(rest.dateOfAdmission) || null,
    dateEnrolled: dateInputValue(rest.dateEnrolled) || null,
    dateClosed: optionalDateIso(rest.dateClosed),
    dateColbRegistered: optionalDateIso(rest.dateColbRegistered),
    dateColbObtained: optionalDateIso(rest.dateColbObtained),
    dateCaseStudyPrepared: optionalDateIso(rest.dateCaseStudyPrepared),
  };
}

const buildEmptyResident = (safehouseId: number, internalCode: string): ResidentForm => ({
  internalCode,
  caseControlNo: "",
  firstName: "",
  lastName: "",
  caseStatus: "Active",
  safehouseId,
  sex: "Female",
  dateOfBirth: new Date().toISOString(),
  placeOfBirth: "",
  religion: "",
  caseCategory: "",
  subCatOrphaned: false,
  subCatTrafficked: false,
  subCatChildLabor: false,
  subCatPhysicalAbuse: false,
  subCatSexualAbuse: false,
  subCatOsaec: false,
  subCatCicl: false,
  subCatAtRisk: false,
  subCatStreetChild: false,
  subCatChildWithHiv: false,
  isPwd: false,
  pwdType: "",
  hasSpecialNeeds: false,
  specialNeedsDiagnosis: "",
  familyIs4Ps: false,
  familySoloParent: false,
  familyIndigenous: false,
  familyParentPwd: false,
  familyInformalSettler: false,
  dateOfAdmission: new Date().toISOString(),
  ageUponAdmission: "",
  presentAge: "",
  lengthOfStay: "",
  referralSource: "",
  referringAgencyPerson: "",
  dateColbRegistered: null,
  dateColbObtained: null,
  assignedSocialWorker: "",
  initialCaseAssessment: "",
  dateCaseStudyPrepared: null,
  reintegrationType: "",
  reintegrationStatus: "",
  initialRiskLevel: "",
  currentRiskLevel: "",
  dateEnrolled: new Date().toISOString(),
  dateClosed: null,
  notesRestricted: "",
});

function CaseCategoryControl({
  value,
  onChange,
  options,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  disabled?: boolean;
  placeholder: string;
}) {
  const mergedOptions = useMemo(() => {
    if (value && !options.includes(value)) {
      return [...options, value].sort((a, b) => a.localeCompare(b));
    }
    return options;
  }, [options, value]);

  if (mergedOptions.length === 0) {
    return (
      <Input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    );
  }

  const selectValue = value || "__none__";

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => onChange(next === "__none__" ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">{placeholder}</SelectItem>
        {mergedOptions.map((cat) => (
          <SelectItem key={cat} value={cat}>
            {cat}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const Caseload = () => {
  const auth = useAuth();
  const { i18n, t } = useTranslation("caseload");
  const queryClient = useQueryClient();
  const [signOutPending, setSignOutPending] = useState(false);
  const [search, setSearch] = useState("");
  const [caseStatus, setCaseStatus] = useState("all");
  const [safehouseId, setSafehouseId] = useState("all");
  const [caseCategory, setCaseCategory] = useState("all");
  const [assignedSocialWorker, setAssignedSocialWorker] = useState("all");
  const [pageSize, setPageSize] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Resident | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ResidentForm | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const dashboardPath = withPathLanguage("/dashboard", i18n.resolvedLanguage);
  const caseloadPath = withPathLanguage("/dashboard/caseload", i18n.resolvedLanguage);
  const socialMediaPath = withPathLanguage("/dashboard/social-media", i18n.resolvedLanguage);
  const processRecordingPath = withPathLanguage("/dashboard/process-recordings", i18n.resolvedLanguage);
  const homeVisitationPath = withPathLanguage("/dashboard/home-visitations", i18n.resolvedLanguage);
  const reportsPath = withPathLanguage("/dashboard/reports", i18n.resolvedLanguage);
  const navigationItems: AdminNavItem[] = [
    { label: t("sidebar.dashboard"), icon: LayoutDashboard, to: dashboardPath },
    { label: t("sidebar.socialMedia"), icon: Megaphone, to: socialMediaPath },
    { label: t("sidebar.residents"), icon: UsersRound, to: caseloadPath, active: true },
    { label: t("sidebar.processRecording"), icon: ClipboardList, to: processRecordingPath },
    { label: t("sidebar.homeVisitation"), icon: CalendarClock, to: homeVisitationPath },
    { label: t("sidebar.donations"), icon: HeartHandshake, disabled: true },
    { label: t("sidebar.safehouses"), icon: Home, disabled: true },
    { label: t("sidebar.reports"), icon: FileBarChart2, to: reportsPath },
    { label: t("sidebar.settings"), icon: Settings, disabled: true },
  ];

  const caseloadQuery = useQuery({
    queryKey: [
      "admin-caseload-residents",
      search,
      caseStatus,
      safehouseId,
      caseCategory,
      assignedSocialWorker,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (caseStatus !== "all") params.set("caseStatus", caseStatus);
      if (safehouseId !== "all") params.set("safehouseId", safehouseId);
      if (caseCategory !== "all") params.set("caseCategory", caseCategory);
      if (assignedSocialWorker !== "all") params.set("assignedSocialWorker", assignedSocialWorker);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      return auth.authenticatedJson<CaseloadResponse>(`/api/admin/caseload/residents${suffix}`);
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async ({ residentId, body }: { residentId?: number; body: ResidentForm }) => {
      const payload = buildResidentUpsertPayload(body);
      if (residentId) {
        return auth.authenticatedJson<Resident>(`/api/admin/caseload/residents/${residentId}`, {
          method: "PUT",
          body: payload,
        });
      }
      return auth.authenticatedJson<Resident>("/api/admin/caseload/residents", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-caseload-residents"] });
      setIsEditing(false);
      setIsCreateOpen(false);
      setSaveErrorMessage(null);
      if (data && variables.residentId) {
        setSelected(data);
        setForm({ ...data });
      }
    },
    onError: (error) => {
      setSaveErrorMessage(getErrorMessage(error, t("errors.saveFailed")));
    },
  });

  const residents = caseloadQuery.data?.residents ?? [];
  const safehouses = caseloadQuery.data?.safehouses ?? [];
  const caseCategoryOptions = caseloadQuery.data?.caseCategoryOptions ?? [];
  const totalResidents = residents.length;
  const effectivePageSize = pageSize === "all" ? totalResidents || 1 : Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(totalResidents / effectivePageSize));
  const pagedResidents = useMemo(() => {
    const start = (currentPage - 1) * effectivePageSize;
    return residents.slice(start, start + effectivePageSize);
  }, [currentPage, effectivePageSize, residents]);

  const handleLogout = async () => {
    setSignOutPending(true);
    try {
      await auth.logout();
    } finally {
      setSignOutPending(false);
    }
  };

  const openResident = (resident: Resident) => {
    setSelected(resident);
    setForm({ ...resident });
    setIsEditing(false);
    setSaveErrorMessage(null);
  };

  const selectedSubcategories = (resident: Resident) =>
    subCategoryKeys.filter((key) => resident[key] === true).map((key) => t(`subCategories.${key}`));

  const getResidentDisplayName = (resident: Pick<Resident, "firstName" | "lastName" | "internalCode">) => {
    const first = (resident.firstName ?? "").trim();
    const last = (resident.lastName ?? "").trim();
    if (first && last) {
      return `${first} ${last.charAt(0).toUpperCase()}.`;
    }
    if (first) {
      return first;
    }
    return resident.internalCode || t("cards.unnamedResident");
  };

  return (
    <AdminWorkspace items={navigationItems} signOutPending={signOutPending} onSignOut={handleLogout}>
      <section className="border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("header.kicker")}</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{t("header.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("header.description")}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              const nextCode = computeNextLsInternalCode(residents.map((r) => r.internalCode));
              setIsCreateOpen(true);
              setForm(buildEmptyResident(safehouses[0]?.safehouseId ?? 1, nextCode));
              setSaveErrorMessage(null);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("actions.addResident")}
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <Label htmlFor="search">{t("filters.search")}</Label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              value={search}
              onChange={(event) => {
                setCurrentPage(1);
                setSearch(event.target.value);
              }}
              className="pl-9"
              placeholder={t("filters.searchPlaceholder")}
            />
          </div>
        </div>
        <div>
          <Label>{t("filters.caseStatus")}</Label>
          <Select value={caseStatus} onValueChange={(value) => { setCurrentPage(1); setCaseStatus(value); }}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {(caseloadQuery.data?.filterOptions.caseStatuses ?? []).map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("filters.safehouse")}</Label>
          <Select value={safehouseId} onValueChange={(value) => { setCurrentPage(1); setSafehouseId(value); }}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {safehouses.map((value) => (
                <SelectItem key={value.safehouseId} value={value.safehouseId.toString()}>{value.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("filters.caseCategory")}</Label>
          <Select value={caseCategory} onValueChange={(value) => { setCurrentPage(1); setCaseCategory(value); }}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {(caseloadQuery.data?.filterOptions.caseCategories ?? []).map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t("filters.socialWorker")}</Label>
          <Select
            value={assignedSocialWorker}
            onValueChange={(value) => {
              setCurrentPage(1);
              setAssignedSocialWorker(value);
            }}
          >
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {(caseloadQuery.data?.filterOptions.assignedSocialWorkers ?? []).map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">{t("list.residentCount", { count: totalResidents })}</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("list.perPage")}</span>
          <Select
            value={pageSize}
            onValueChange={(value) => {
              setPageSize(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="all">{t("common.all")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {caseloadQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse bg-card" />
          ))}
        </div>
      ) : caseloadQuery.isError ? (
        <Card className="border-destructive/20">
          <CardContent className="flex items-start gap-3 p-5">
            <CircleAlert className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="text-sm text-muted-foreground">
              {getErrorMessage(caseloadQuery.error, t("errors.loadFailed"))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pagedResidents.map((resident) => {
            const subcategories = selectedSubcategories(resident);
            return (
              <button
                key={resident.residentId}
                type="button"
                onClick={() => openResident(resident)}
                className="text-left"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{getResidentDisplayName(resident)}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t("cards.socialWorker")}: {resident.assignedSocialWorker || t("cards.unassigned")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{resident.caseStatus || t("cards.noStatus")}</Badge>
                      <Badge variant="secondary">{resident.safehouseName}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="text-muted-foreground">
                      {resident.sex} • {dateInputValue(resident.dateOfBirth) || t("cards.dobNotSet")}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {resident.caseCategory || t("cards.noCategory")}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {subcategories.length > 0 ? subcategories.join(", ") : t("cards.noSubcategories")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </section>
      )}

      <section className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          {t("pagination.previous")}
        </Button>
        <span className="text-sm text-muted-foreground">
          {t("pagination.pageOf", { page: currentPage, total: totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        >
          {t("pagination.next")}
        </Button>
      </section>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.profileTitle")}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-6">
              {saveErrorMessage ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {saveErrorMessage}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing((current) => !current)}>
                  {isEditing ? t("actions.cancelEdit") : t("actions.edit")}
                </Button>
                {isEditing ? (
                  <Button
                    type="button"
                    disabled={upsertMutation.isPending || !selected}
                    onClick={() => selected && upsertMutation.mutate({ residentId: selected.residentId, body: form })}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {t("actions.save")}
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("fields.internalCode")}>
                  <Input
                    value={form.internalCode}
                    readOnly
                    className="cursor-not-allowed bg-muted/50"
                    aria-readonly="true"
                  />
                </Field>
                <Field label={t("fields.firstName")}>
                  <Input
                    value={form.firstName ?? ""}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.lastName")}>
                  <Input
                    value={form.lastName ?? ""}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.caseControlNo")}>
                  <Input
                    value={form.caseControlNo}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, caseControlNo: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.caseStatus")}>
                  <Input
                    value={form.caseStatus}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, caseStatus: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.caseCategory")}>
                  <CaseCategoryControl
                    value={form.caseCategory}
                    onChange={(next) => setForm({ ...form, caseCategory: next })}
                    options={caseCategoryOptions}
                    disabled={!isEditing}
                    placeholder={t("fields.caseCategoryPlaceholder")}
                  />
                </Field>
                <Field label={t("fields.safehouse")}>
                  <Select
                    value={form.safehouseId.toString()}
                    onValueChange={(value) => setForm({ ...form, safehouseId: Number(value) })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {safehouses.map((safehouse) => (
                        <SelectItem key={safehouse.safehouseId} value={safehouse.safehouseId.toString()}>
                          {safehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("fields.assignedSocialWorker")}>
                  <Input
                    value={form.assignedSocialWorker}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, assignedSocialWorker: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.dateOfBirth")}>
                  <Input
                    type="date"
                    value={dateInputValue(form.dateOfBirth)}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.dateOfAdmission")}>
                  <Input
                    type="date"
                    value={dateInputValue(form.dateOfAdmission)}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, dateOfAdmission: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.referralSource")}>
                  <Input
                    value={form.referralSource}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, referralSource: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.reintegrationStatus")}>
                  <Input
                    value={form.reintegrationStatus ?? ""}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, reintegrationStatus: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.pwdType")}>
                  <Input
                    value={form.pwdType ?? ""}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, pwdType: event.target.value })}
                  />
                </Field>
                <Field label={t("fields.specialNeedsDiagnosis")}>
                  <Input
                    value={form.specialNeedsDiagnosis ?? ""}
                    disabled={!isEditing}
                    onChange={(event) => setForm({ ...form, specialNeedsDiagnosis: event.target.value })}
                  />
                </Field>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {t("sections.caseSubcategories")}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {subCategoryKeys.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(form[key])}
                        disabled={!isEditing}
                        onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                      />
                      {t(`subCategories.${key}`)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {t("sections.familyProfile")}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {familyProfileKeys.map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(form[key])}
                        disabled={!isEditing}
                        onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                      />
                      {t(`familyProfile.${key}`)}
                    </label>
                  ))}
                </div>
              </div>

              <Field label={t("fields.restrictedNotes")}>
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.notesRestricted ?? ""}
                  disabled={!isEditing}
                  onChange={(event) => setForm({ ...form, notesRestricted: event.target.value })}
                />
              </Field>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{t("dialogs.createTitle")}</DialogTitle>
          </DialogHeader>
          {form ? (
            <div className="space-y-4">
              {saveErrorMessage ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {saveErrorMessage}
                </div>
              ) : null}
              <Field label={t("fields.internalCode")}>
                <Input
                  value={form.internalCode}
                  readOnly
                  className="cursor-not-allowed bg-muted/50"
                  aria-readonly="true"
                />
              </Field>
              <Field label={t("fields.firstName")}>
                <Input value={form.firstName ?? ""} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
              </Field>
              <Field label={t("fields.lastName")}>
                <Input value={form.lastName ?? ""} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
              </Field>
              <Field label={t("fields.caseControlNo")}>
                <Input value={form.caseControlNo} onChange={(event) => setForm({ ...form, caseControlNo: event.target.value })} />
              </Field>
              <Field label={t("fields.caseStatus")}>
                <Input value={form.caseStatus} onChange={(event) => setForm({ ...form, caseStatus: event.target.value })} />
              </Field>
              <Field label={t("fields.caseCategory")}>
                <CaseCategoryControl
                  value={form.caseCategory}
                  onChange={(next) => setForm({ ...form, caseCategory: next })}
                  options={caseCategoryOptions}
                  placeholder={t("fields.caseCategoryPlaceholder")}
                />
              </Field>
              <Field label={t("fields.safehouse")}>
                <Select
                  value={form.safehouseId.toString()}
                  onValueChange={(value) => setForm({ ...form, safehouseId: Number(value) })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {safehouses.map((safehouse) => (
                      <SelectItem key={safehouse.safehouseId} value={safehouse.safehouseId.toString()}>
                        {safehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  {t("actions.cancel")}
                </Button>
                <Button type="button" disabled={upsertMutation.isPending} onClick={() => upsertMutation.mutate({ body: form })}>
                  <Save className="mr-2 h-4 w-4" />
                  {t("actions.save")}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminWorkspace>
  );
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    {children}
  </div>
);

export default Caseload;
