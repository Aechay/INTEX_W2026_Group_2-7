import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarClock,
  ClipboardList,
  FileBarChart2,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import useAuth from "@/auth/useAuth";
import AdminWorkspace, { type AdminNavItem } from "@/components/admin/AdminWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { withPathLanguage } from "@/i18n/routing";

// ---- API types ----

type MonthlyTotal = { year: number; month: number; totalEstimatedValue: number; count: number };
type ByType = { donationType: string; totalEstimatedValue: number; count: number };
type ByCampaign = { campaignName: string; totalEstimatedValue: number; count: number };
type DonationTrendsData = { monthlyTotals: MonthlyTotal[]; byType: ByType[]; byCampaign: ByCampaign[] };

type CountByLabel = { label: string; count: number };
type ResidentOutcomesData = {
  byCaseStatus: CountByLabel[];
  byRiskLevel: CountByLabel[];
  byReintegrationStatus: CountByLabel[];
  avgEducationProgress: number | null;
  avgHealthScore: number | null;
};

type SafehouseRow = {
  safehouseId: number;
  safehouseName: string;
  avgEducationProgress: number | null;
  avgHealthScore: number | null;
  totalProcessRecordings: number;
  totalHomeVisitations: number;
  totalIncidents: number;
};

type ActivityMonthly = { year: number; month: number; count: number };
type ServiceActivityData = {
  processRecordingsByMonth: ActivityMonthly[];
  homeVisitationsByMonth: ActivityMonthly[];
  incidentsByType: CountByLabel[];
};

// ---- Helpers ----

const monthLabel = (year: number, month: number) => {
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(d);
};

const currencyFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const formatCurrency = (v: number) => `DR$${currencyFmt.format(v)}`;

const percentFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const decimalFmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const SectionSkeleton = () => (
  <div className="h-64 animate-pulse rounded-none bg-muted" />
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
    {message}
  </div>
);

// ---- Component ----

const Reports = () => {
  const auth = useAuth();
  const { i18n, t } = useTranslation("reports");
  const [signOutPending, setSignOutPending] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dashboardPath = withPathLanguage("/dashboard", i18n.resolvedLanguage);
  const socialMediaPath = withPathLanguage("/dashboard/social-media", i18n.resolvedLanguage);
  const caseloadPath = withPathLanguage("/dashboard/caseload", i18n.resolvedLanguage);
  const processRecordingPath = withPathLanguage("/dashboard/process-recordings", i18n.resolvedLanguage);
  const homeVisitationPath = withPathLanguage("/dashboard/home-visitations", i18n.resolvedLanguage);
  const reportsPath = withPathLanguage("/dashboard/reports", i18n.resolvedLanguage);

  const navigationItems: AdminNavItem[] = [
    { label: t("sidebar.dashboard"), icon: LayoutDashboard, to: dashboardPath },
    { label: t("sidebar.socialMedia"), icon: Megaphone, to: socialMediaPath },
    { label: t("sidebar.residents"), icon: UsersRound, to: caseloadPath },
    { label: t("sidebar.processRecording"), icon: ClipboardList, to: processRecordingPath },
    { label: t("sidebar.homeVisitation"), icon: CalendarClock, to: homeVisitationPath },
    { label: t("sidebar.donations"), icon: HeartHandshake, disabled: true },
    { label: t("sidebar.safehouses"), icon: Home, disabled: true },
    { label: t("sidebar.reports"), icon: FileBarChart2, to: reportsPath, active: true },
    { label: t("sidebar.settings"), icon: Settings, disabled: true },
  ];

  const dateParams = () => {
    const p = new URLSearchParams();
    if (startDate) p.set("startDate", startDate);
    if (endDate) p.set("endDate", endDate);
    return p.toString() ? `?${p.toString()}` : "";
  };

  const donationQuery = useQuery({
    queryKey: ["reports-donation-trends", startDate, endDate],
    queryFn: () =>
      auth.authenticatedJson<DonationTrendsData>(`/api/admin/reports/donation-trends${dateParams()}`),
  });

  const outcomesQuery = useQuery({
    queryKey: ["reports-resident-outcomes"],
    queryFn: () =>
      auth.authenticatedJson<ResidentOutcomesData>("/api/admin/reports/resident-outcomes"),
  });

  const safehouseQuery = useQuery({
    queryKey: ["reports-safehouse-performance", startDate, endDate],
    queryFn: () =>
      auth.authenticatedJson<SafehouseRow[]>(`/api/admin/reports/safehouse-performance${dateParams()}`),
  });

  const activityQuery = useQuery({
    queryKey: ["reports-service-activity", startDate, endDate],
    queryFn: () =>
      auth.authenticatedJson<ServiceActivityData>(`/api/admin/reports/service-activity${dateParams()}`),
  });

  const handleLogout = async () => {
    setSignOutPending(true);
    try {
      await auth.logout();
    } finally {
      setSignOutPending(false);
    }
  };

  // Chart data transforms
  const monthlyChartData = (donationQuery.data?.monthlyTotals ?? []).map((m) => ({
    label: monthLabel(m.year, m.month),
    total: m.totalEstimatedValue,
    count: m.count,
  }));

  const byTypeChartData = (donationQuery.data?.byType ?? []).map((t) => ({
    label: t.donationType,
    total: t.totalEstimatedValue,
    count: t.count,
  }));

  const processRecChartData = (activityQuery.data?.processRecordingsByMonth ?? []).map((m) => ({
    label: monthLabel(m.year, m.month),
    count: m.count,
  }));

  const homeVisChartData = (activityQuery.data?.homeVisitationsByMonth ?? []).map((m) => ({
    label: monthLabel(m.year, m.month),
    count: m.count,
  }));

  const incidentTypeData = (activityQuery.data?.incidentsByType ?? []).map((i) => ({
    label: i.label,
    count: i.count,
  }));

  const caseStatusData = (outcomesQuery.data?.byCaseStatus ?? []).map((i) => ({
    label: i.label,
    count: i.count,
  }));

  const riskLevelData = (outcomesQuery.data?.byRiskLevel ?? []).map((i) => ({
    label: i.label,
    count: i.count,
  }));

  return (
    <AdminWorkspace
      items={navigationItems}
      signOutPending={signOutPending}
      onSignOut={handleLogout}
    >
      {/* Header */}
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

      {/* Date range filter */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("filters.startDate")}
              </Label>
              <Input
                type="date"
                className="rounded-none w-[180px]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                {t("filters.endDate")}
              </Label>
              <Input
                type="date"
                className="rounded-none w-[180px]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none"
                onClick={() => { setStartDate(""); setEndDate(""); }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Donation Trends */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardHeader className="px-5 py-4 pb-0">
          <CardTitle className="text-xl font-semibold">{t("donationTrends.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("donationTrends.description")}</p>
        </CardHeader>
        <CardContent className="space-y-6 p-5">
          {donationQuery.isLoading ? (
            <SectionSkeleton />
          ) : monthlyChartData.length === 0 ? (
            <EmptyState message={t("donationTrends.noData")} />
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">{t("donationTrends.monthlyChart")}</p>
                <ChartContainer
                  className="h-[260px] w-full"
                  config={{ total: { label: "Total (DR$)", color: "hsl(var(--primary))" } }}
                >
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${currencyFmt.format(v as number)}`} tick={{ fontSize: 11 }} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ChartContainer>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">{t("donationTrends.byTypeChart")}</p>
                {byTypeChartData.length === 0 ? (
                  <EmptyState message={t("donationTrends.noData")} />
                ) : (
                  <ChartContainer
                    className="h-[260px] w-full"
                    config={{ total: { label: "Total (DR$)", color: "hsl(var(--secondary))" } }}
                  >
                    <BarChart data={byTypeChartData} layout="vertical">
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `$${currencyFmt.format(v as number)}`} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={90} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />
                        }
                      />
                      <Bar dataKey="total" fill="var(--color-total)" radius={[0, 4, 4, 0]} maxBarSize={32} />
                    </BarChart>
                  </ChartContainer>
                )}
              </div>
            </div>
          )}

          {/* Campaign table */}
          {!donationQuery.isLoading && (donationQuery.data?.byCampaign ?? []).length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t("donationTrends.campaignTable")}</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("donationTrends.campaign")}</TableHead>
                      <TableHead className="text-right">{t("donationTrends.totalValue")}</TableHead>
                      <TableHead className="text-right">{t("donationTrends.count")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(donationQuery.data?.byCampaign ?? []).map((c) => (
                      <TableRow key={c.campaignName}>
                        <TableCell className="text-sm font-medium">{c.campaignName}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(c.totalEstimatedValue)}</TableCell>
                        <TableCell className="text-right text-sm">{c.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Resident Outcomes */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardHeader className="px-5 py-4 pb-0">
          <CardTitle className="text-xl font-semibold">{t("residentOutcomes.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("residentOutcomes.description")}</p>
        </CardHeader>
        <CardContent className="space-y-6 p-5">
          {outcomesQuery.isLoading ? (
            <SectionSkeleton />
          ) : (
            <>
              {/* Metric cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-border bg-background p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("residentOutcomes.avgEducationProgress")}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">
                    {outcomesQuery.data?.avgEducationProgress != null
                      ? `${percentFmt.format(outcomesQuery.data.avgEducationProgress)}%`
                      : "—"}
                  </div>
                </div>
                <div className="border border-border bg-background p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {t("residentOutcomes.avgHealthScore")}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-foreground">
                    {outcomesQuery.data?.avgHealthScore != null
                      ? `${decimalFmt.format(outcomesQuery.data.avgHealthScore)}/5`
                      : "—"}
                  </div>
                </div>
              </div>

              {caseStatusData.length === 0 ? (
                <EmptyState message={t("residentOutcomes.noData")} />
              ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">{t("residentOutcomes.byCaseStatus")}</p>
                    <ChartContainer
                      className="h-[220px] w-full"
                      config={{ count: { label: "Residents", color: "hsl(var(--primary))" } }}
                    >
                      <BarChart data={caseStatusData} layout="vertical">
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} maxBarSize={28} />
                      </BarChart>
                    </ChartContainer>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">{t("residentOutcomes.byRiskLevel")}</p>
                    <ChartContainer
                      className="h-[220px] w-full"
                      config={{ count: { label: "Residents", color: "hsl(var(--secondary))" } }}
                    >
                      <BarChart data={riskLevelData} layout="vertical">
                        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} maxBarSize={28} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Safehouse Performance */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardHeader className="px-5 py-4 pb-0">
          <CardTitle className="text-xl font-semibold">{t("safehousePerformance.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("safehousePerformance.description")}</p>
        </CardHeader>
        <CardContent className="p-5">
          {safehouseQuery.isLoading ? (
            <SectionSkeleton />
          ) : (safehouseQuery.data ?? []).length === 0 ? (
            <EmptyState message={t("safehousePerformance.noData")} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("safehousePerformance.safehouse")}</TableHead>
                    <TableHead className="text-right">{t("safehousePerformance.avgEducationProgress")}</TableHead>
                    <TableHead className="text-right">{t("safehousePerformance.avgHealthScore")}</TableHead>
                    <TableHead className="text-right">{t("safehousePerformance.processRecordings")}</TableHead>
                    <TableHead className="text-right">{t("safehousePerformance.homeVisitations")}</TableHead>
                    <TableHead className="text-right">{t("safehousePerformance.incidents")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(safehouseQuery.data ?? []).map((row) => (
                    <TableRow key={row.safehouseId}>
                      <TableCell className="text-sm font-medium">{row.safehouseName}</TableCell>
                      <TableCell className="text-right text-sm">
                        {row.avgEducationProgress != null ? `${percentFmt.format(row.avgEducationProgress)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {row.avgHealthScore != null ? `${decimalFmt.format(row.avgHealthScore)}/5` : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">{row.totalProcessRecordings}</TableCell>
                      <TableCell className="text-right text-sm">{row.totalHomeVisitations}</TableCell>
                      <TableCell className="text-right text-sm">{row.totalIncidents}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: Service Activity */}
      <Card className="rounded-none border border-border bg-card shadow-none">
        <CardHeader className="px-5 py-4 pb-0">
          <CardTitle className="text-xl font-semibold">{t("serviceActivity.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("serviceActivity.description")}</p>
        </CardHeader>
        <CardContent className="space-y-6 p-5">
          {activityQuery.isLoading ? (
            <SectionSkeleton />
          ) : processRecChartData.length === 0 && homeVisChartData.length === 0 ? (
            <EmptyState message={t("serviceActivity.noData")} />
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {processRecChartData.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">{t("serviceActivity.processRecordingsChart")}</p>
                  <ChartContainer
                    className="h-[220px] w-full"
                    config={{ count: { label: "Sessions", color: "hsl(var(--primary))" } }}
                  >
                    <BarChart data={processRecChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

              {homeVisChartData.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">{t("serviceActivity.homeVisitationsChart")}</p>
                  <ChartContainer
                    className="h-[220px] w-full"
                    config={{ count: { label: "Visits", color: "hsl(var(--secondary))" } }}
                  >
                    <BarChart data={homeVisChartData}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

              {incidentTypeData.length > 0 && (
                <div className="xl:col-span-2">
                  <p className="mb-2 text-sm font-medium text-foreground">{t("serviceActivity.incidentsByType")}</p>
                  <ChartContainer
                    className="h-[220px] w-full"
                    config={{ count: { label: "Incidents", color: "hsl(var(--destructive))" } }}
                  >
                    <BarChart data={incidentTypeData} layout="vertical">
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                      <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={120} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} maxBarSize={28} />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminWorkspace>
  );
};

export default Reports;
