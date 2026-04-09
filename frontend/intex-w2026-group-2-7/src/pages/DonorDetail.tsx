import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  FileBarChart2,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Settings,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import useAuth from "@/auth/useAuth";
import AdminWorkspace, { type AdminNavItem } from "@/components/admin/AdminWorkspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { withPathLanguage } from "@/i18n/routing";

type DonorDetailResponse = {
  supporterId: number;
  displayName: string;
  totalByDonor: number;
  totalAllDonations: number;
  totalDonationCount: number;
  donations: Array<{
    donationId: number;
    donationDate: string;
    donationType: string;
    estimatedValue: number;
  }>;
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

const formatDonationType = (value: string) => {
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
      return value;
  }
};

const DonorDetail = () => {
  const { i18n, t } = useTranslation("dashboard");
  const auth = useAuth();
  const params = useParams();
  const supporterId = Number(params.supporterId);

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

  const donorQuery = useQuery({
    queryKey: ["admin-donor-detail", supporterId],
    queryFn: () =>
      auth.authenticatedJson<DonorDetailResponse>(
        `/api/admin/donations/donors/${supporterId}`,
      ),
    enabled: Number.isFinite(supporterId),
  });

  const totalByDonor = donorQuery.data?.totalByDonor ?? 0;
  const totalAll = donorQuery.data?.totalAllDonations ?? 0;
  const totalCount = donorQuery.data?.totalDonationCount ?? 0;
  const donations = useMemo(
    () =>
      donorQuery.data?.donations.map((donation) => ({
        ...donation,
        formattedDate: dateFormatter.format(new Date(donation.donationDate)),
        formattedType: formatDonationType(donation.donationType),
        formattedValue: formatCurrency(donation.estimatedValue),
      })) ?? [],
    [donorQuery.data],
  );

  return (
    <AdminWorkspace items={navigationItems} signOutPending={false} onSignOut={auth.logout}>
      <div className="flex flex-col gap-8">
        <header className="rounded-none border border-border bg-card px-6 py-6 shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Donor
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {donorQuery.data?.displayName ?? "Donor details"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Review all contributions from this supporter and their total giving.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border border-border shadow-none">
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Total donations
                  </p>
                  <p className="text-2xl font-semibold text-foreground">{totalCount}</p>
                  <p className="text-sm text-muted-foreground">
                    Donations from this supporter
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-border shadow-none">
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Total estimated value
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {formatCurrency(totalByDonor)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Combined giving from this supporter
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </header>

        <Card className="rounded-none border border-border shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base font-semibold text-foreground">
              Donation history
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Estimated value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donorQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Loading donation history…
                    </TableCell>
                  </TableRow>
                ) : donations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No donations recorded for this supporter yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.map((donation) => (
                    <TableRow key={donation.donationId}>
                      <TableCell>{donation.formattedDate}</TableCell>
                      <TableCell>{donation.formattedType}</TableCell>
                      <TableCell>{donation.formattedValue}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminWorkspace>
  );
};

export default DonorDetail;
