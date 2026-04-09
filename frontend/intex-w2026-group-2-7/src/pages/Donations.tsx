import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  FileBarChart2,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import useAuth from "@/auth/useAuth";
import AdminWorkspace, { type AdminNavItem } from "@/components/admin/AdminWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { withPathLanguage } from "@/i18n/routing";

type DonorProfile = {
  name: string;
  donorType: "Monetary" | "Volunteer" | "In-kind" | "Skills" | "Social Media";
  status: "Active" | "Inactive";
  lastContribution: string;
  totalValue: string;
  supporterId: number;
};

type Contribution = {
  date: string;
  contributor: string;
  type: "Monetary" | "In-kind" | "Time" | "Skills" | "Social Media";
  allocation: string;
  value: string;
};

type DonationsOverviewResponse = {
  donors: Array<{
    supporterId: number;
    displayName: string;
    supporterType: string;
    status: string;
    lastDonationDate: string | null;
    totalEstimatedValue: number;
  }>;
  contributions: Array<{
    donationId: number;
    donationDate: string;
    supporterName: string;
    donationType: string;
    allocationLabel: string;
    estimatedValue: number;
    currencyCode: string | null;
  }>;
  allocationCoverage: Array<{
    programArea: string;
    amountAllocated: number;
    percentAllocated: number;
  }>;
  totalDonors: number;
  page: number;
  pageSize: number;
  totalContributions: number;
  contributionsPage: number;
  contributionsPageSize: number;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatCurrency = (value: number) => `DR$${currencyFormatter.format(value)}`;

const formatDonorType = (value: string): DonorProfile["donorType"] => {
  switch (value) {
    case "MonetaryDonor":
      return "Monetary";
    case "InKindDonor":
      return "In-kind";
    case "SocialMediaAdvocate":
      return "Social Media";
    case "SkillsContributor":
      return "Skills";
    default:
      return value as DonorProfile["donorType"];
  }
};

const formatContributionType = (value: string): Contribution["type"] => {
  switch (value) {
    case "Monetary":
    case "MonetaryDonor":
      return "Monetary";
    case "InKind":
    case "InKindDonation":
    case "InKindDonor":
      return "In-kind";
    case "SocialMedia":
    case "SocialMediaAdvocate":
      return "Social Media";
    case "Skills":
    case "SkillsContributor":
      return "Skills";
    case "Time":
    case "Volunteer":
      return "Time";
    default:
      return value as Contribution["type"];
  }
};

const Donations = () => {
  const { t, i18n } = useTranslation("dashboard");
  const auth = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [donorType, setDonorType] = useState("all");
  const [status, setStatus] = useState("all");
  const [contributionType, setContributionType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [contributionsPage, setContributionsPage] = useState(1);
  const [contributionsPageSize, setContributionsPageSize] = useState("10");

  const dashboardPath = withPathLanguage("/dashboard", i18n.resolvedLanguage);
  const caseloadPath = withPathLanguage("/dashboard/caseload", i18n.resolvedLanguage);
  const donationsPath = withPathLanguage("/dashboard/donations", i18n.resolvedLanguage);
  const navigationItems: AdminNavItem[] = [
    { label: t("sidebar.dashboard"), icon: LayoutDashboard, to: dashboardPath },
    { label: t("sidebar.residents"), icon: UsersRound, to: caseloadPath },
    { label: t("sidebar.donations"), icon: HeartHandshake, to: donationsPath, active: true },
    { label: t("sidebar.caseConferences"), icon: CalendarClock, disabled: true },
    { label: t("sidebar.safehouses"), icon: Home, disabled: true },
    { label: t("sidebar.reports"), icon: FileBarChart2, disabled: true },
    { label: t("sidebar.settings"), icon: Settings, disabled: true },
  ];

  useEffect(() => {
    setCurrentPage(1);
    setContributionsPage(1);
  }, [search, donorType, status, contributionType, pageSize, contributionsPageSize]);

  const donationsQuery = useQuery({
    queryKey: [
      "admin-donations-overview",
      search,
      donorType,
      status,
      contributionType,
      currentPage,
      pageSize,
      contributionsPage,
      contributionsPageSize,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (donorType !== "all") params.set("donorType", donorType);
      if (status !== "all") params.set("status", status);
      if (contributionType !== "all") params.set("contributionType", contributionType);
      params.set("page", currentPage.toString());
      params.set("pageSize", pageSize);
      params.set("contributionsPage", contributionsPage.toString());
      params.set("contributionsPageSize", contributionsPageSize);
      const queryString = params.toString();
      return auth.authenticatedJson<DonationsOverviewResponse>(
        `/api/admin/donations/overview${queryString ? `?${queryString}` : ""}`,
      );
    },
  });

  const donors: DonorProfile[] = useMemo(() => {
    if (!donationsQuery.data) return [];
    return donationsQuery.data.donors.map((donor) => ({
      name: donor.displayName,
      donorType: formatDonorType(donor.supporterType),
      status: (donor.status as DonorProfile["status"]) ?? "Active",
      lastContribution: donor.lastDonationDate
        ? dateFormatter.format(new Date(donor.lastDonationDate))
        : "No recent donations",
      totalValue: formatCurrency(donor.totalEstimatedValue),
      supporterId: donor.supporterId,
    }));
  }, [donationsQuery.data]);

  const contributions: Contribution[] = useMemo(() => {
    if (!donationsQuery.data) return [];
    return donationsQuery.data.contributions.map((contribution) => ({
      date: dateFormatter.format(new Date(contribution.donationDate)),
      contributor: contribution.supporterName,
      type: formatContributionType(contribution.donationType),
      allocation: contribution.allocationLabel,
      value: formatCurrency(contribution.estimatedValue),
    }));
  }, [donationsQuery.data]);

  const allocations = useMemo(
    () =>
      donationsQuery.data?.allocationCoverage.map((allocation) => ({
        label: allocation.programArea,
        value: allocation.percentAllocated,
      })) ?? [],
    [donationsQuery.data],
  );

  const handleLogout = async () => {
    await auth.logout();
  };

  const isLoading = donationsQuery.isLoading;
  const hasNoData =
    !isLoading &&
    (donationsQuery.data?.donors.length ?? 0) === 0 &&
    (donationsQuery.data?.contributions.length ?? 0) === 0;
  const totalDonors = donationsQuery.data?.totalDonors ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalDonors / Number(pageSize)));
  const totalContributions = donationsQuery.data?.totalContributions ?? 0;
  const contributionPages = Math.max(
    1,
    Math.ceil(totalContributions / Number(contributionsPageSize)),
  );

  return (
    <AdminWorkspace items={navigationItems} signOutPending={false} onSignOut={handleLogout}>
      <div className="flex flex-col gap-8">
        <header className="rounded-none border border-border bg-card px-6 py-6 shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Donations
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Donors & Contributions
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Track donor profiles, contribution activity, and how gifts are allocated across
                safehouses and program areas.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add donor
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Record contribution
              </Button>
            </div>
          </div>
        </header>

        <Card className="rounded-none border border-border shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground">
              Search & filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search donors or contributions"
                className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              />
            </div>
            <Select value={donorType} onValueChange={setDonorType}>
              <SelectTrigger>
                <SelectValue placeholder="Donor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All donor types</SelectItem>
                <SelectItem value="Monetary">Monetary</SelectItem>
                <SelectItem value="Volunteer">Volunteer</SelectItem>
                <SelectItem value="In-kind">In-kind</SelectItem>
                <SelectItem value="Skills">Skills</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contributionType} onValueChange={setContributionType}>
              <SelectTrigger>
                <SelectValue placeholder="Contribution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All contributions</SelectItem>
                <SelectItem value="Monetary">Monetary</SelectItem>
                <SelectItem value="In-kind">In-kind</SelectItem>
                <SelectItem value="Time">Time</SelectItem>
                <SelectItem value="Skills">Skills</SelectItem>
                <SelectItem value="Social Media">Social Media</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <Card className="rounded-none border border-border shadow-none">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base font-semibold text-foreground">
                  Donor profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last contribution</TableHead>
                      <TableHead>Total value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Loading donors…
                      </TableCell>
                      </TableRow>
                    ) : donors.length === 0 ? (
                      <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No donor records found yet.
                      </TableCell>
                      </TableRow>
                    ) : (
                      donors.map((donor) => (
                      <TableRow
                        key={donor.supporterId}
                        className="cursor-pointer"
                        onClick={() =>
                          navigate(withPathLanguage(`/dashboard/donations/${donor.supporterId}`, i18n.resolvedLanguage))
                        }
                      >
                        <TableCell className="font-medium">{donor.name}</TableCell>
                        <TableCell>
                          <Badge variant={donor.status === "Active" ? "default" : "secondary"}>
                            {donor.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{donor.lastContribution}</TableCell>
                        <TableCell>{donor.totalValue}</TableCell>
                      </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Rows per page</span>
                    <Select value={pageSize} onValueChange={setPageSize}>
                      <SelectTrigger className="h-8 w-[90px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1 || isLoading}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages || isLoading}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border border-border shadow-none">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base font-semibold text-foreground">
                  Allocation coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading allocation coverage…</p>
                ) : allocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No allocation records found yet.
                  </p>
                ) : (
                  allocations.map((allocation) => (
                    <div key={allocation.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-foreground">
                        <span>{allocation.label}</span>
                        <span className="text-muted-foreground">{allocation.value}%</span>
                      </div>
                      <Progress value={allocation.value} className="bg-neutral-300" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-none border border-border shadow-none">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-semibold text-foreground">
                Contribution activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Allocation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Loading contributions…
                      </TableCell>
                    </TableRow>
                  ) : contributions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No contributions recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    contributions.map((contribution) => (
                      <TableRow key={`${contribution.date}-${contribution.contributor}`}>
                        <TableCell>{contribution.date}</TableCell>
                        <TableCell className="font-medium">{contribution.contributor}</TableCell>
                        <TableCell>{contribution.type}</TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{contribution.allocation}</div>
                          <div className="text-xs text-muted-foreground">{contribution.value}</div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page</span>
                  <Select value={contributionsPageSize} onValueChange={setContributionsPageSize}>
                    <SelectTrigger className="h-8 w-[90px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={contributionsPage <= 1 || isLoading}
                    onClick={() => setContributionsPage((page) => Math.max(1, page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {contributionsPage} of {contributionPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={contributionsPage >= contributionPages || isLoading}
                    onClick={() =>
                      setContributionsPage((page) => Math.min(contributionPages, page + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {hasNoData && (
        <p className="text-sm text-muted-foreground">
          No donation data has been recorded yet. Once contributions are added, they will appear
          here.
        </p>
      )}
    </AdminWorkspace>
  );
};

export default Donations;
