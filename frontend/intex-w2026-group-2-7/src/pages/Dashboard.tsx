import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BedDouble,
  CalendarClock,
  CircleAlert,
  FileBarChart2,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
  UsersRound,
} from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getErrorMessage } from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import Navbar from "@/components/Navbar";
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
import { useIsMobile } from "@/hooks/use-mobile";
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

const donationFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
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

const formatCurrency = (value: number) => donationFormatter.format(value);

const formatPercent = (value: number | null | undefined) =>
  value === null || value === undefined ? "No data" : `${percentFormatter.format(value)}%`;

const formatHealthScore = (value: number | null | undefined) =>
  value === null || value === undefined ? "No data" : `${decimalFormatter.format(value)}/5`;

const formatDate = (value: string | null | undefined) =>
  value ? dateFormatter.format(new Date(value)) : "No date";

const formatDateTime = (value: string) => dateTimeFormatter.format(new Date(value));

const formatMonth = (value: string | null | undefined) =>
  value ? monthFormatter.format(new Date(value)) : "No period";

const formatConferenceTiming = (daysFromToday: number) => {
  if (daysFromToday === 0) {
    return "Today";
  }

  if (daysFromToday > 0) {
    return `In ${daysFromToday} day${daysFromToday === 1 ? "" : "s"}`;
  }

  const overdueDays = Math.abs(daysFromToday);
  return `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`;
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

const AdminSidebar = ({
  isOpen,
  isMobile,
  dashboardPath,
  email,
  signOutPending,
  onSignOut,
  activeSafehouses,
}: {
  isOpen: boolean;
  isMobile: boolean;
  dashboardPath: string;
  email?: string;
  signOutPending: boolean;
  onSignOut: () => Promise<void>;
  activeSafehouses: number;
}) => {
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: dashboardPath, active: true },
    { label: "Residents", icon: UsersRound, disabled: true },
    { label: "Donations", icon: HeartHandshake, disabled: true },
    { label: "Case Conferences", icon: CalendarClock, disabled: true },
    { label: "Safehouses", icon: Home, disabled: true },
    { label: "Reports", icon: FileBarChart2, disabled: true },
    { label: "Settings", icon: Settings, disabled: true },
  ] as const;

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-16 z-40 w-72 border-r border-primary/20 bg-foreground text-white transition-transform duration-200",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
      aria-hidden={!isOpen && isMobile}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-primary/20 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground/80">
            <Shield className="h-4 w-4 text-primary" />
            Admin
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 border-l-4 border-transparent px-4 py-3 text-sm text-white/60"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 border-l-4 px-4 py-3 text-sm font-medium",
                  item.active
                    ? "border-primary bg-primary/15 text-white"
                    : "border-transparent text-white/80",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-primary/20 px-4 py-4">
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Signed In
              </div>
              <div className="mt-1 truncate text-white/90">{email ?? "Admin"}</div>
            </div>
            <div className="flex items-center justify-between border border-white/10 px-3 py-2">
              <span className="text-white/70">Active safehouses</span>
              <span className="font-semibold text-primary">{activeSafehouses}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-center gap-2 rounded-none border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => void onSignOut()}
              disabled={signOutPending}
            >
              <LogOut className="h-4 w-4" />
              {signOutPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
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
  const isMobile = useIsMobile();
  const [signOutPending, setSignOutPending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024,
  );

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
  const progressChartData = (overview?.progressTrend ?? []).map((point) => ({
    ...point,
    monthLabel: formatMonth(point.monthStart),
  }));
  const conferenceHighlights = overview?.conferenceQueue.highlights ?? [];
  const showingUpcomingConferences = (overview?.conferenceQueue.upcomingCount ?? 0) > 0;

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      {sidebarOpen && isMobile ? (
        <button
          type="button"
          aria-label="Hide sidebar"
          className="fixed inset-0 top-16 z-30 bg-black/35"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}
      <AdminSidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        dashboardPath={dashboardPath}
        email={auth.user?.email}
        signOutPending={signOutPending}
        onSignOut={handleLogout}
        activeSafehouses={overview?.summary.activeSafehouses ?? 0}
      />
      <main className={cn("w-full transition-[padding] duration-200", sidebarOpen ? "lg:pl-72" : "lg:pl-0")}>
        <section className="min-w-0 space-y-6 px-4 py-4 lg:px-6 lg:py-6">
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
                    Dashboard data is unavailable
                  </h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {getErrorMessage(
                      overviewQuery.error,
                      "The operational overview could not be loaded right now.",
                    )}
                  </p>
                </div>
                <Button type="button" onClick={() => void overviewQuery.refetch()}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : overview ? (
            <>
              <section className="border border-border bg-card">
                <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit justify-center gap-2 rounded-none"
                      onClick={() => setSidebarOpen((current) => !current)}
                    >
                      {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                      {sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                    </Button>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Dashboard
                      </div>
                      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                        Admin Dashboard
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Resident capacity, donation activity, conference scheduling, and care
                        progress.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="border border-border bg-background px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Reporting Month
                      </div>
                      <div className="mt-1 text-sm font-medium text-foreground">
                        {formatMonth(overview.progressSnapshot.monthStart)}
                      </div>
                    </div>
                    <div className="border border-border bg-background px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Last Refreshed
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
                  title="Active residents"
                  value={overview.summary.activeResidents.toString()}
                  detail={`${overview.summary.activeSafehouses} safehouses online`}
                  icon={UsersRound}
                />
                <MetricCard
                  title="Available beds"
                  value={overview.summary.availableBeds.toString()}
                  detail={`${overview.summary.totalCapacity} total capacity`}
                  icon={BedDouble}
                />
                <MetricCard
                  title="Recent donations"
                  value={formatCurrency(overview.summary.recentDonationTotal)}
                  detail={`${overview.summary.recentDonationCount} gifts in the last 90 days`}
                  icon={HeartHandshake}
                />
                <MetricCard
                  title="Upcoming conferences"
                  value={overview.summary.upcomingCaseConferenceCount.toString()}
                  detail={
                    overview.summary.overdueCaseConferenceCount > 0
                      ? `${overview.summary.overdueCaseConferenceCount} need rescheduling`
                      : "Conference calendar is clear"
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
                          Progress snapshot
                        </CardTitle>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Education and health indicators from the latest completed reporting
                          periods.
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit rounded-none bg-primary/5 px-3 py-1 text-primary">
                        Updated through {formatMonth(overview.progressSnapshot.monthStart)}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="border border-border bg-background p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Education Progress
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">
                          {formatPercent(overview.progressSnapshot.avgEducationProgress)}
                        </div>
                      </div>
                      <div className="border border-border bg-background p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Health Score
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-foreground">
                          {formatHealthScore(overview.progressSnapshot.avgHealthScore)}
                        </div>
                      </div>
                      <div className="border border-border bg-background p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Care Activity
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground">
                          <span>{overview.progressSnapshot.processRecordingCount} sessions</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{overview.progressSnapshot.homeVisitationCount} visits</span>
                          <span className="text-muted-foreground">•</span>
                          <span>{overview.progressSnapshot.incidentCount} incidents</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-4">
                    <ChartContainer
                      className="h-[320px] w-full"
                      config={{
                        avgEducationProgress: {
                          label: "Education progress",
                          color: "hsl(var(--primary))",
                        },
                        avgHealthScore: {
                          label: "Health score",
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
                                    {name === "avgHealthScore" ? "Health score" : "Education progress"}
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
                      Safehouse occupancy
                    </CardTitle>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Live bed availability across all active locations.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 p-6 pt-2">
                    <div className="border-l-4 border-primary bg-background px-4 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Network Utilization
                      </div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                        {formatPercent(
                          overview.summary.totalCapacity === 0
                            ? 0
                            : (overview.summary.activeResidents / overview.summary.totalCapacity) * 100,
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {overview.summary.activeResidents} residents across {overview.summary.activeSafehouses} active
                        safehouses.
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
                                {safehouse.availableBeds} open
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
                          Case conference calendar
                        </CardTitle>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {showingUpcomingConferences
                            ? "Next scheduled case conferences requiring staff attention."
                            : "No future conferences are scheduled. These plans need a new date."}
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
                          ? `${overview.conferenceQueue.upcomingCount} upcoming`
                          : `${overview.conferenceQueue.overdueCount} overdue`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6 pt-2">
                    {conferenceHighlights.length === 0 ? (
                      <div className="border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                        No case conferences are on the calendar right now.
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
                                  {formatConferenceTiming(conference.daysFromToday)}
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
                              {formatDate(conference.caseConferenceDate)}
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
                          Recent donations
                        </CardTitle>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Latest recorded gifts and in-kind support from the last 90 days.
                        </p>
                      </div>
                      <Badge variant="outline" className="w-fit rounded-none bg-primary/10 px-3 py-1 text-primary">
                        {overview.summary.recentDonationCount} total
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-6 pt-2">
                    {overview.recentDonations.length === 0 ? (
                      <div className="border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                        No recent donations are available for this reporting window.
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
                                {donation.donationType} via {donation.channelSource}
                              </p>
                              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {formatDate(donation.donationDate)}
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
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
