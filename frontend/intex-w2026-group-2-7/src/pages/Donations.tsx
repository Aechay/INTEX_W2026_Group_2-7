import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type DonorCreateForm = {
  displayName: string;
  email: string;
  phone: string;
  supporterType: string;
  organizationName: string;
  firstName: string;
  lastName: string;
  relationshipType: string;
  region: string;
  country: string;
  status: string;
  acquisitionChannel: string;
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

const formatDisplayLabel = (value: string) =>
  value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();

const getImpactUnitForDonationType = (value: string) => {
  switch (value) {
    case "Monetary":
    case "MonetaryDonor":
      return "Pesos";
    case "Time":
    case "Volunteer":
      return "Hours";
    case "InKind":
    case "InKindDonation":
    case "InKindDonor":
      return "Items";
    case "SocialMedia":
    case "SocialMediaAdvocate":
      return "Campaigns";
    case "Skills":
    case "SkillsContributor":
      return "Hours";
    default:
      return "Pesos";
  }
};

const Donations = () => {
  const { t, i18n } = useTranslation("dashboard");
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [donorType, setDonorType] = useState("all");
  const [status, setStatus] = useState("all");
  const [contributionType, setContributionType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [contributionsPage, setContributionsPage] = useState(1);
  const [contributionsPageSize, setContributionsPageSize] = useState("10");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [contributionError, setContributionError] = useState<string | null>(null);
  const [contributionFieldErrors, setContributionFieldErrors] = useState<Record<string, string>>(
    {},
  );
  const [supporterSearch, setSupporterSearch] = useState("");
  const [createForm, setCreateForm] = useState<DonorCreateForm>({
    displayName: "",
    email: "",
    phone: "",
    supporterType: "MonetaryDonor",
    organizationName: "",
    firstName: "",
    lastName: "",
    relationshipType: "",
    region: "National",
    country: "Dominican Republic",
    status: "Active",
    acquisitionChannel: "",
  });
  const [contributionForm, setContributionForm] = useState({
    supporterId: "",
    donationType: "Monetary",
    donationDate: "",
    estimatedValue: "",
    impactUnit: "Pesos",
    programArea: "",
    safehouseId: "",
  });

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

  useEffect(() => {
    setContributionForm((current) => ({
      ...current,
      impactUnit: getImpactUnitForDonationType(current.donationType),
    }));
  }, [contributionForm.donationType]);

  const createDonorMutation = useMutation({
    mutationFn: (payload: DonorCreateForm) =>
      auth.authenticatedJson<{ supporterId: number; displayName: string }>(
        "/api/admin/donations/donors",
        {
          method: "POST",
          body: payload,
        },
      ),
    onSuccess: () => {
      setIsCreateOpen(false);
      setCreateError(null);
      setFieldErrors({});
      setDisplayNameTouched(false);
      queryClient.invalidateQueries({ queryKey: ["admin-donations-overview"] });
    },
    onError: (error: unknown) => {
      setCreateError(
        error instanceof Error ? error.message : "Unable to create donor. Please try again.",
      );
    },
  });

  const metadataQuery = useQuery({
    queryKey: ["admin-donations-metadata"],
    queryFn: () =>
      auth.authenticatedJson<{
        relationshipTypes: string[];
        acquisitionChannels: string[];
        safehouses: Array<{ safehouseId: number; name: string }>;
        programAreas: string[];
      }>("/api/admin/donations/metadata"),
  });

  const supportersQuery = useQuery({
    queryKey: ["admin-donation-supporters", supporterSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (supporterSearch.trim()) params.set("search", supporterSearch.trim());
      const queryString = params.toString();
      return auth.authenticatedJson<Array<{ supporterId: number; displayName: string; email: string }>>(
        `/api/admin/donations/supporters${queryString ? `?${queryString}` : ""}`,
      );
    },
    enabled: isContributionOpen,
  });

  const createContributionMutation = useMutation({
    mutationFn: (payload: {
      supporterId: number;
      donationType: string;
      donationDate: string;
      estimatedValue: number;
      impactUnit: string;
      programArea: string;
      safehouseId: number;
    }) =>
      auth.authenticatedJson<{ donationId: number; supporterId: number }>(
        "/api/admin/donations/contributions",
        {
          method: "POST",
          body: {
            supporterId: payload.supporterId,
            donationType: payload.donationType,
            donationDate: payload.donationDate,
            estimatedValue: payload.estimatedValue,
            impactUnit: payload.impactUnit,
            programArea: payload.programArea,
            safehouseId: payload.safehouseId,
          },
        },
      ),
    onSuccess: () => {
      setIsContributionOpen(false);
      setContributionError(null);
      setContributionFieldErrors({});
      setContributionForm({
        supporterId: "",
        donationType: "Monetary",
        donationDate: "",
        estimatedValue: "",
        impactUnit: "Pesos",
        programArea: "",
        safehouseId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-donations-overview"] });
    },
    onError: (error: unknown) => {
      setContributionError(
        error instanceof Error ? error.message : "Unable to record contribution. Please try again.",
      );
    },
  });

  const validateCreateForm = (form: DonorCreateForm) => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (!form.displayName.trim()) errors.displayName = "Display name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    if (!form.phone.trim()) errors.phone = "Phone is required.";
    if (!form.supporterType.trim()) errors.supporterType = "Supporter type is required.";
    if (!form.relationshipType.trim()) errors.relationshipType = "Relationship type is required.";
    if (!form.region.trim()) errors.region = "Region is required.";
    if (!form.country.trim()) errors.country = "Country is required.";
    if (!form.status.trim()) errors.status = "Status is required.";
    if (!form.acquisitionChannel.trim()) errors.acquisitionChannel = "Acquisition channel is required.";
    return errors;
  };

  const validateContributionForm = () => {
    const errors: Record<string, string> = {};
    if (!contributionForm.supporterId) errors.supporterId = "Supporter is required.";
    if (!contributionForm.donationType) errors.donationType = "Donation type is required.";
    if (!contributionForm.donationDate) errors.donationDate = "Donation date is required.";
    if (!contributionForm.estimatedValue) errors.estimatedValue = "Estimated value is required.";
    if (!contributionForm.programArea) errors.programArea = "Program area is required.";
    if (!contributionForm.safehouseId) errors.safehouseId = "Safehouse is required.";
    return errors;
  };

  useEffect(() => {
    if (displayNameTouched) return;
    const combined = `${createForm.firstName} ${createForm.lastName}`.trim();
    if (combined) {
      setCreateForm((current) => ({ ...current, displayName: combined }));
    }
  }, [createForm.firstName, createForm.lastName, displayNameTouched]);

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
              <Button variant="outline" className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Add donor
              </Button>
              <Button className="gap-2" onClick={() => setIsContributionOpen(true)}>
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
            <div className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search donors or contributions"
                className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add donor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {createError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {createError}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input
                  value={createForm.firstName}
                  onChange={(event) => {
                    setCreateForm({ ...createForm, firstName: event.target.value });
                    if (fieldErrors.firstName) {
                      setFieldErrors((current) => ({ ...current, firstName: "" }));
                    }
                  }}
                />
                {fieldErrors.firstName ? (
                  <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
                ) : null}
              </Field>
              <Field label="Last name">
                <Input
                  value={createForm.lastName}
                  onChange={(event) => {
                    setCreateForm({ ...createForm, lastName: event.target.value });
                    if (fieldErrors.lastName) {
                      setFieldErrors((current) => ({ ...current, lastName: "" }));
                    }
                  }}
                />
                {fieldErrors.lastName ? (
                  <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
                ) : null}
              </Field>
            </div>
            <Field label="Display name">
              <Input
                value={createForm.displayName}
                onChange={(event) => {
                  setDisplayNameTouched(true);
                  setCreateForm({ ...createForm, displayName: event.target.value });
                  if (fieldErrors.displayName) {
                    setFieldErrors((current) => ({ ...current, displayName: "" }));
                  }
                }}
              />
              {fieldErrors.displayName ? (
                <p className="text-xs text-destructive">{fieldErrors.displayName}</p>
              ) : null}
            </Field>
            <Field label="Email">
              <Input
                value={createForm.email}
                onChange={(event) => {
                  setCreateForm({ ...createForm, email: event.target.value });
                  if (fieldErrors.email) {
                    setFieldErrors((current) => ({ ...current, email: "" }));
                  }
                }}
              />
              {fieldErrors.email ? (
                <p className="text-xs text-destructive">{fieldErrors.email}</p>
              ) : null}
            </Field>
            <Field label="Phone">
              <Input
                value={createForm.phone}
                onChange={(event) => {
                  setCreateForm({ ...createForm, phone: event.target.value });
                  if (fieldErrors.phone) {
                    setFieldErrors((current) => ({ ...current, phone: "" }));
                  }
                }}
              />
              {fieldErrors.phone ? (
                <p className="text-xs text-destructive">{fieldErrors.phone}</p>
              ) : null}
            </Field>
            <Field label="Supporter type">
              <Select
                value={createForm.supporterType}
                onValueChange={(value) => {
                  setCreateForm({ ...createForm, supporterType: value });
                  if (fieldErrors.supporterType) {
                    setFieldErrors((current) => ({ ...current, supporterType: "" }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MonetaryDonor">Monetary</SelectItem>
                  <SelectItem value="InKindDonor">In-kind</SelectItem>
                  <SelectItem value="SkillsContributor">Skills</SelectItem>
                  <SelectItem value="SocialMediaAdvocate">Social Media</SelectItem>
                  <SelectItem value="Volunteer">Volunteer</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Organization name (optional)">
              <Input
                value={createForm.organizationName}
                onChange={(event) =>
                  setCreateForm({ ...createForm, organizationName: event.target.value })
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Relationship type">
                <Select
                  value={createForm.relationshipType}
                  onValueChange={(value) => {
                    setCreateForm({ ...createForm, relationshipType: value });
                    if (fieldErrors.relationshipType) {
                      setFieldErrors((current) => ({ ...current, relationshipType: "" }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                  {metadataQuery.data?.relationshipTypes?.length ? (
                    metadataQuery.data.relationshipTypes
                      .filter((option) => option !== "Supporter")
                      .map((option) => (
                        <SelectItem key={option} value={option}>
                          {formatDisplayLabel(option)}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value={createForm.relationshipType}>
                      {formatDisplayLabel(createForm.relationshipType)}
                    </SelectItem>
                  )}
                  </SelectContent>
                </Select>
                {fieldErrors.relationshipType ? (
                  <p className="text-xs text-destructive">{fieldErrors.relationshipType}</p>
                ) : null}
              </Field>
              <Field label="Region">
                <Input
                  value={createForm.region}
                  onChange={(event) => {
                    setCreateForm({ ...createForm, region: event.target.value });
                    if (fieldErrors.region) {
                      setFieldErrors((current) => ({ ...current, region: "" }));
                    }
                  }}
                />
                {fieldErrors.region ? (
                  <p className="text-xs text-destructive">{fieldErrors.region}</p>
                ) : null}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country">
                <Input
                  value={createForm.country}
                  onChange={(event) => {
                    setCreateForm({ ...createForm, country: event.target.value });
                    if (fieldErrors.country) {
                      setFieldErrors((current) => ({ ...current, country: "" }));
                    }
                  }}
                />
                {fieldErrors.country ? (
                  <p className="text-xs text-destructive">{fieldErrors.country}</p>
                ) : null}
              </Field>
              <Field label="Status">
                <Select
                  value={createForm.status}
                  onValueChange={(value) => {
                    setCreateForm({ ...createForm, status: value });
                    if (fieldErrors.status) {
                      setFieldErrors((current) => ({ ...current, status: "" }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.status ? (
                  <p className="text-xs text-destructive">{fieldErrors.status}</p>
                ) : null}
              </Field>
            </div>
            <Field label="Acquisition channel">
              <Select
                value={createForm.acquisitionChannel}
                onValueChange={(value) => {
                  setCreateForm({ ...createForm, acquisitionChannel: value });
                  if (fieldErrors.acquisitionChannel) {
                    setFieldErrors((current) => ({ ...current, acquisitionChannel: "" }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select acquisition channel" />
                </SelectTrigger>
                <SelectContent>
                  {metadataQuery.data?.acquisitionChannels?.length ? (
                    metadataQuery.data.acquisitionChannels
                      .filter((option) => option !== "Manual")
                      .map((option) => (
                      <SelectItem key={option} value={option}>
                        {formatDisplayLabel(option)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={createForm.acquisitionChannel}>
                      {formatDisplayLabel(createForm.acquisitionChannel)}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {fieldErrors.acquisitionChannel ? (
                <p className="text-xs text-destructive">{fieldErrors.acquisitionChannel}</p>
              ) : null}
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createDonorMutation.isPending}
                onClick={() => {
                  const errors = validateCreateForm(createForm);
                  setFieldErrors(errors);
                  if (Object.keys(errors).length > 0) {
                    return;
                  }
                  createDonorMutation.mutate(createForm);
                }}
              >
                Save donor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isContributionOpen} onOpenChange={setIsContributionOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Record contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {contributionError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {contributionError}
              </div>
            ) : null}
            <Field label="Supporter">
              <Select
                value={contributionForm.supporterId}
                onValueChange={(value) => {
                  setContributionForm({ ...contributionForm, supporterId: value });
                  if (contributionFieldErrors.supporterId) {
                    setContributionFieldErrors((current) => ({ ...current, supporterId: "" }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a supporter" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-3 py-2">
                    <Input
                      placeholder="Search supporters"
                      value={supporterSearch}
                      onChange={(event) => setSupporterSearch(event.target.value)}
                    />
                  </div>
                  {supportersQuery.data?.length ? (
                    supportersQuery.data.map((supporter) => (
                      <SelectItem key={supporter.supporterId} value={supporter.supporterId.toString()}>
                        {supporter.displayName} • {supporter.email}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No supporters found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {contributionFieldErrors.supporterId ? (
                <p className="text-xs text-destructive">{contributionFieldErrors.supporterId}</p>
              ) : null}
            </Field>
            <Field label="Donation type">
              <Select
                value={contributionForm.donationType}
                onValueChange={(value) => {
                  setContributionForm({ ...contributionForm, donationType: value });
                  if (contributionFieldErrors.donationType) {
                    setContributionFieldErrors((current) => ({ ...current, donationType: "" }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monetary">Monetary</SelectItem>
                  <SelectItem value="InKind">In-kind</SelectItem>
                  <SelectItem value="Skills">Skills</SelectItem>
                  <SelectItem value="SocialMedia">Social Media</SelectItem>
                  <SelectItem value="Time">Time</SelectItem>
                </SelectContent>
              </Select>
              {contributionFieldErrors.donationType ? (
                <p className="text-xs text-destructive">{contributionFieldErrors.donationType}</p>
              ) : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Program area">
                <Select
                  value={contributionForm.programArea}
                  onValueChange={(value) => {
                    setContributionForm({ ...contributionForm, programArea: value });
                    if (contributionFieldErrors.programArea) {
                      setContributionFieldErrors((current) => ({ ...current, programArea: "" }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program area" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadataQuery.data?.programAreas?.length ? (
                      metadataQuery.data.programAreas.map((option) => (
                        <SelectItem key={option} value={option}>
                          {formatDisplayLabel(option)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="General">General</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {contributionFieldErrors.programArea ? (
                  <p className="text-xs text-destructive">{contributionFieldErrors.programArea}</p>
                ) : null}
              </Field>
              <Field label="Safehouse">
                <Select
                  value={contributionForm.safehouseId}
                  onValueChange={(value) => {
                    setContributionForm({ ...contributionForm, safehouseId: value });
                    if (contributionFieldErrors.safehouseId) {
                      setContributionFieldErrors((current) => ({ ...current, safehouseId: "" }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select safehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {metadataQuery.data?.safehouses?.length ? (
                      metadataQuery.data.safehouses.map((option) => (
                        <SelectItem key={option.safehouseId} value={option.safehouseId.toString()}>
                          {option.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="0" disabled>
                        No safehouses found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {contributionFieldErrors.safehouseId ? (
                  <p className="text-xs text-destructive">{contributionFieldErrors.safehouseId}</p>
                ) : null}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Donation date">
                <Input
                  type="date"
                  value={contributionForm.donationDate}
                  onChange={(event) => {
                    setContributionForm({ ...contributionForm, donationDate: event.target.value });
                    if (contributionFieldErrors.donationDate) {
                      setContributionFieldErrors((current) => ({ ...current, donationDate: "" }));
                    }
                  }}
                />
                {contributionFieldErrors.donationDate ? (
                  <p className="text-xs text-destructive">{contributionFieldErrors.donationDate}</p>
                ) : null}
              </Field>
              <Field label="Estimated value (DR$)">
                <Input
                  type="number"
                  min="0"
                  value={contributionForm.estimatedValue}
                  onChange={(event) => {
                    setContributionForm({ ...contributionForm, estimatedValue: event.target.value });
                    if (contributionFieldErrors.estimatedValue) {
                      setContributionFieldErrors((current) => ({ ...current, estimatedValue: "" }));
                    }
                  }}
                />
                {contributionFieldErrors.estimatedValue ? (
                  <p className="text-xs text-destructive">{contributionFieldErrors.estimatedValue}</p>
                ) : null}
              </Field>
            </div>
            <Field label="Impact unit">
              <Input
                value={contributionForm.impactUnit}
                onChange={(event) =>
                  setContributionForm({ ...contributionForm, impactUnit: event.target.value })
                }
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsContributionOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createContributionMutation.isPending}
                onClick={() => {
                  const errors = validateContributionForm();
                  setContributionFieldErrors(errors);
                  if (Object.keys(errors).length > 0) return;
                  createContributionMutation.mutate({
                    supporterId: Number(contributionForm.supporterId),
                    donationType: contributionForm.donationType,
                    donationDate: contributionForm.donationDate,
                    estimatedValue: Number(contributionForm.estimatedValue),
                    impactUnit: contributionForm.impactUnit,
                    programArea: contributionForm.programArea,
                    safehouseId: Number(contributionForm.safehouseId),
                  });
                }}
              >
                Save contribution
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminWorkspace>
  );
};

export default Donations;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    {children}
  </div>
);
