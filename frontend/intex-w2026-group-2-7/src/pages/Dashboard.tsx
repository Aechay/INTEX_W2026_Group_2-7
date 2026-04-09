import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BedDouble,
  CalendarClock,
  CircleAlert,
  ClipboardList,
  FileBarChart2,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Megaphone,
  Settings,
  UsersRound,
} from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import AdminWorkspace, { type AdminNavItem } from "@/components/admin/AdminWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { withPathLanguage } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type DashboardOverviewResponse = {
  generatedAt: string;
  summary: {
    activeResidents: number;
    totalCapacity: number;
    availableBeds: number;
    activeSafehouses: number;
    recentDonationTotal: number;
    recentDonationCount: number;
    upcomingCaseConferenceCount: number;
    overdueCaseConferenceCount: number;
  };
  progressSnapshot: {
    monthStart: string | null;
    avgEducationProgress: number | null;
    avgHealthScore: number | null;
    processRecordingCount: number;
    homeVisitationCount: number;
    incidentCount: number;
  };
  safehouses: Array<{
    safehouseId: number;
    safehouseCode: string;
    name: string;
    region: string;
    currentOccupancy: number;
    capacity: number;
    utilizationRate: number;
    availableBeds: number;
  }>;
  progressTrend: Array<{
    monthStart: string;
    avgEducationProgress: number | null;
    avgHealthScore: number | null;
  }>;
  recentDonations: Array<{
    donationId: number;
    supporterName: string;
    donationType: string;
    channelSource: string;
    donationDate: string;
    estimatedValue: number;
    impactUnit: string;
  }>;
  conferenceQueue: {
    upcomingCount: number;
    overdueCount: number;
    highlights: Array<{
      planId: number;
      residentCode: string;
      planCategory: string;
      safehouseName: string;
      assignedSocialWorker: string;
      caseConferenceDate: string;
      status: string;
      daysFromToday: number;
    }>;
  };
};

const donationFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const decimalFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
});

const formatCurrency = (value: number) => `DR$${donationFormatter.format(value)}`;

const formatPercent = (value: number | null | undefined, noDataLabel: string) =>
  value === null || value === undefined ? noDataLabel : `${percentFormatter.format(value)}%`;

const formatHealthScore = (value: number | null | undefined, noDataLabel: string) =>
  value === null || value === undefined ? noDataLabel : `${decimalFormatter.format(value)}/5`;

const formatDate = (value: string | null | undefined, noDateLabel: string) =>
  value ? dateFormatter.format(new Date(value)) : noDateLabel;

const formatDateTime = (value: string) => dateTimeFormatter.format(new Date(value));

const formatMonth = (value: string | null | undefined, noPeriodLabel: string) =>
  value ? monthFormatter.format(new Date(value)) : noPeriodLabel;

const formatConferenceTiming = (
  daysFromToday: number,
  labels: { today: string; inDays: string; overdue: string },
) => {
  if (daysFromToday === 0) {
    return labels.today;
  }

  if (daysFromToday > 0) {
    return labels.inDays.replace("{{count}}", daysFromToday.toString());
  }

  const overdueDays = Math.abs(daysFromToday);
  return labels.overdue.replace("{{count}}", overdueDays.toString());
};

const getConferenceBadgeClassName = (daysFromToday: number) => {
  if (daysFromToday < 0) {
    return "border-0 bg-secondary/15 text-secondary";
  }

  if (daysFromToday === 0) {
    return "border-0 bg-accent/25 text-foreground";
  }

  return "border-0 bg-primary/15 text-primary";
};

const MetricCard = ({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof UsersRound;
}) => (
  <Card className="overflow-hidden rounded-none border border-border bg-card shadow-none">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="border-l-4 border-primary pl-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const LoadingDashboard = () => (
  <div className="space-y-6">
    <div className="h-32 animate-pulse bg-card" />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse bg-card" />
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
      <div className="h-[26rem] animate-pulse bg-card" />
      <div className="h-[26rem] animate-pulse bg-card" />
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="h-[22rem] animate-pulse bg-card" />
      <div className="h-[22rem] animate-pulse bg-card" />
    </div>
  </div>
);

const Dashboard = () => {
  const auth = useAuth();
  const { i18n } = useTranslation("common");
  const { t } = useTranslation("dashboard");
  const [signOutPending, setSignOutPending] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: () =>
      auth.authenticatedJson<DashboardOverviewResponse>("/api/admin/dashboard/overview"),
  });

  const handleLogout = async () => {
    setSignOutPending(true);
    try {
      await auth.logout();
    } finally {
      setSignOutPending(false);
    }
  };

  const overview = overviewQuery.data;
  const dashboardPath = withPathLanguage("/dashboard", i18n.resolvedLanguage);
  const caseloadPath = withPathLanguage("/dashboard/caseload", i18n.resolvedLanguage);
  const socialMediaPath = withPathLanguage("/dashboard/social-media", i18n.resolvedLanguage);
  const processRecordingPath = withPathLanguage("/dashboard/process-recordings", i18n.resolvedLanguage);
  const homeVisitationPath = withPathLanguage("/dashboard/home-visitations", i18n.resolvedLanguage);
  const reportsPath = withPathLanguage("/dashboard/reports", i18n.resolvedLanguage);
  const navigationItems: AdminNavItem[] = [
    { label: t("sidebar.dashboard"), icon: LayoutDashboard, to: dashboardPath, active: true },
    { label: t("sidebar.socialMedia"), icon: Megaphone, to: socialMediaPath },
    { label: t("sidebar.residents"), icon: UsersRound, to: caseloadPath },
    { label: t("sidebar.processRecording"), icon: ClipboardList, to: processRecordingPath },
    { label: t("sidebar.homeVisitation"), icon: CalendarClock, to: homeVisitationPath },
    { label: t("sidebar.donations"), icon: HeartHandshake, disabled: true },
    { label: t("sidebar.safehouses"), icon: Home, disabled: true },
    { label: t("sidebar.reports"), icon: FileBarChart2, to: reportsPath },
    { label: t("sidebar.settings"), icon: Settings, disabled: true },
  ];
  const progressChartData = (overview?.progressTrend ?? []).map((point) => ({
    ...point,
    monthLabel: formatMonth(point.monthStart, t("common.noPeriod")),
  }));
  const conferenceHighlights = overview?.conferenceQueue.highlights ?? [];
  const showingUpcomingConferences = (overview?.conferenceQueue.upcomingCount ?? 0) > 0;

  return (
    <AdminWorkspace
      items={navigationItems}
      signOutPending={signOutPending}
      onSignOut={handleLogout}
    >
      {overviewQuery.isLoading && !overview ? (
        <LoadingDashboard />
      ) : overviewQuery.isError ? (
        <Card className="rounded-none border border-destructive/20 bg-card shadow-none">
          <CardContent className="flex flex-col items-start gap-4 p-8">
            <div className="border-l-4 border-destructive pl-3 text-destructive">
              <CircleAlert className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("error.title")}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {getErrorMessage(
                  overviewQuery.error,
                  t("error.description"),
                )}
              </p>
            </div>
            <Button type="button" onClick={() => void overviewQuery.refetch()}>
              {t("actions.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      ) : overview ? (
        <>
          <section className="border border-border bg-card">
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-border bg-background px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("header.reportingMonth")}
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {formatMonth(overview.progressSnapshot.monthStart, t("common.noPeriod"))}
                  </div>
                </div>
                <div className="border border-border bg-background px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {t("header.lastRefreshed")}
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {formatDateTime(overview.generatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title={t("metrics.activeResidents.title")}
              value={overview.summary.activeResidents.toString()}
              detail={t("metrics.activeResidents.detail", { count: overview.summary.activeSafehouses })}
              icon={UsersRound}
            />
            <MetricCard
              title={t("metrics.availableBeds.title")}
              value={overview.summary.availableBeds.toString()}
              detail={t("metrics.availableBeds.detail", { count: overview.summary.totalCapacity })}
              icon={BedDouble}
            />
            <MetricCard
              title={t("metrics.recentDonations.title")}
              value={formatCurrency(overview.summary.recentDonationTotal)}
              detail={t("metrics.recentDonations.detail", { count: overview.summary.recentDonationCount })}
              icon={HeartHandshake}
            />
            <MetricCard
              title={t("metrics.upcomingConferences.title")}
              value={overview.summary.upcomingCaseConferenceCount.toString()}
              detail={
                overview.summary.overdueCaseConferenceCount > 0
                  ? t("metrics.upcomingConferences.detailOverdue", {
                      count: overview.summary.overdueCaseConferenceCount,
                    })
                  : t("metrics.upcomingConferences.detailClear")
              }
              icon={CalendarClock}
            />
          </section>

              <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                <Card className="rounded-none border border-border bg-card shadow-none">
                  <CardHeader className="space-y-4 p-6 pb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                          {t("progress.title")}
                        </CardTitle>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {t("progress.description")}
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit rounded-none bg-primary/5 px-3 py-1 text-primary">
                        {t("progress.updatedThrough", {
                          month: formatMonth(overview.progressSnapshot.monthStart, t("common.noPeriod")),
                        })}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="border border-border bg-background p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {t("progress.cards.educationProgress")}
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">
                          {formatPercent(overview.progressSnapshot.avgEducationProgress, t("common.noData"))}
                        </div>
                      </div>
                      <div className="border border-border bg-background p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {t("progress.cards.healthScore")}
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">
                          {formatHealthScore(overview.progressSnapshot.avgHealthScore, t("common.noData"))}
                        </div>
                      </div>
                      <div className="border border-border bg-background p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          {t("progress.cards.careActivity")}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground">
                          <span>{t("progress.cards.sessions", { count: overview.progressSnapshot.processRecordingCount })}</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{t("progress.cards.visits", { count: overview.progressSnapshot.homeVisitationCount })}</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{t("progress.cards.incidents", { count: overview.progressSnapshot.incidentCount })}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-4">
                    <ChartContainer
                      className="h-[320px] w-full"
                      config={{
                        avgEducationProgress: {
                          label: t("progress.chart.educationProgress"),
                          color: "hsl(var(--primary))",
                        },
                        avgHealthScore: {
                          label: t("progress.chart.healthScore"),
                          color: "hsl(var(--secondary))",
                        },
                      }}
                    >
                      <ComposedChart data={progressChartData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} />
                        <YAxis
                          yAxisId="education"
                          domain={[0, 100]}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis
                          yAxisId="health"
                          orientation="right"
                          domain={[0, 5]}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => value.toFixed(1)}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => (
                                <div className="flex min-w-[8rem] items-center justify-between gap-4">
                                  <span className="text-muted-foreground">
                                    {name === "avgHealthScore"
                                      ? t("progress.chart.healthScore")
                                      : t("progress.chart.educationProgress")}
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {name === "avgHealthScore"
                                      ? decimalFormatter.format(Number(value))
                                      : `${percentFormatter.format(Number(value))}%`}
                                  </span>
                                </div>
                              )}
                            />
                          }
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar
                          yAxisId="education"
                          dataKey="avgEducationProgress"
                          fill="var(--color-avgEducationProgress)"
                          radius={[12, 12, 0, 0]}
                          maxBarSize={42}
                        />
                        <Line
                          yAxisId="health"
                          type="monotone"
                          dataKey="avgHealthScore"
                          stroke="var(--color-avgHealthScore)"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "var(--color-avgHealthScore)" }}
                          activeDot={{ r: 5 }}
                        />
                      </ComposedChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="rounded-none border border-border bg-card shadow-none">
                  <CardHeader className="p-6 pb-3">
                    <CardTitle className="text-2xl font-semibold tracking-tight">
                      {t("safehouses.title")}
                    </CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t("safehouses.description")}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6 pt-2">
                    <div className="border-l-4 border-primary bg-background px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {t("safehouses.networkUtilization")}
                      </div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                        {formatPercent(
                          overview.summary.totalCapacity === 0
                            ? 0
                            : (overview.summary.activeResidents / overview.summary.totalCapacity) * 100,
                          t("common.noData"),
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t("safehouses.summary", {
                          residents: overview.summary.activeResidents,
                          safehouses: overview.summary.activeSafehouses,
                        })}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {overview.safehouses.map((safehouse) => (
                        <div
                          key={safehouse.safehouseId}
                          className="border border-border bg-background p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {safehouse.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="rounded-none bg-primary/5 px-2.5 py-0.5 text-[11px] text-primary"
                                >
                                  {safehouse.safehouseCode}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">{safehouse.region}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-foreground">
                                {safehouse.currentOccupancy}/{safehouse.capacity}
                              </div>
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {t("safehouses.openBeds", { count: safehouse.availableBeds })}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 h-2 bg-muted">
                            <div
                              className="h-2 bg-primary"
                              style={{
                                width: `${Math.min(safehouse.utilizationRate * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <Card className="rounded-none border border-border bg-card shadow-none">
                  <CardHeader className="p-6 pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                          {t("conferences.title")}
                        </CardTitle>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {showingUpcomingConferences
                            ? t("conferences.descriptionUpcoming")
                            : t("conferences.descriptionOverdue")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "w-fit rounded-none px-3 py-1",
                          overview.conferenceQueue.overdueCount > 0
                            ? "bg-secondary/10 text-secondary"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {showingUpcomingConferences
                          ? t("conferences.badgeUpcoming", { count: overview.conferenceQueue.upcomingCount })
                          : t("conferences.badgeOverdue", { count: overview.conferenceQueue.overdueCount })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6 pt-2">
                    {conferenceHighlights.length === 0 ? (
                      <div className="border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                        {t("conferences.empty")}
                      </div>
                    ) : (
                      conferenceHighlights.map((conference) => (
                        <div
                          key={conference.planId}
                          className="border border-border bg-background p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {conference.residentCode}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-none px-2.5 py-0.5 text-[11px] font-medium",
                                    getConferenceBadgeClassName(conference.daysFromToday),
                                  )}
                                >
                                  {formatConferenceTiming(conference.daysFromToday, {
                                    today: t("conferences.timing.today"),
                                    inDays: t("conferences.timing.inDays"),
                                    overdue: t("conferences.timing.overdue"),
                                  })}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm font-medium text-foreground">
                                {conference.planCategory}
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {conference.safehouseName} · {conference.assignedSocialWorker}
                              </p>
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              {formatDate(conference.caseConferenceDate, t("common.noDate"))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-none border border-border bg-card shadow-none">
                  <CardHeader className="p-6 pb-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                          {t("donations.title")}
                        </CardTitle>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {t("donations.description")}
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit rounded-none bg-primary/10 px-3 py-1 text-primary">
                        {t("donations.totalBadge", { count: overview.summary.recentDonationCount })}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6 pt-2">
                    {overview.recentDonations.length === 0 ? (
                      <div className="border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                        {t("donations.empty")}
                      </div>
                    ) : (
                      overview.recentDonations.map((donation) => (
                        <div
                          key={donation.donationId}
                          className="border border-border bg-background p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="text-sm font-semibold text-foreground">
                                {donation.supporterName}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {t("donations.via", {
                                  type: donation.donationType,
                                  channel: donation.channelSource,
                                })}
                              </p>
                              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {formatDate(donation.donationDate, t("common.noDate"))}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-foreground">
                                {formatCurrency(donation.estimatedValue)}
                              </div>
                              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                {donation.impactUnit}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </section>
        </>
      ) : null}
    </AdminWorkspace>
  );
};

export default Dashboard;
