import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ClipboardList,
  FileBarChart2,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  Pencil,
  Settings,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import useAuth from "@/auth/useAuth";
import AdminWorkspace, { type AdminNavItem } from "@/components/admin/AdminWorkspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type DonorDetailResponse = {
  supporterId: number;
  displayName: string;
  supporterType: string;
  organizationName: string | null;
  firstName: string | null;
  lastName: string | null;
  relationshipType: string;
  region: string;
  country: string;
  email: string;
  phone: string;
  status: string;
  acquisitionChannel: string;
  totalByDonor: number;
  totalAllDonations: number;
  totalDonationCount: number;
  donations: Array<{
    donationId: number;
    donationDate: string;
    donationType: string;
    estimatedValue: number;
    programArea: string | null;
    safehouseId: number | null;
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

const formatDisplayLabel = (value: string) =>
  value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\s+/g, " ").trim();

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
  const queryClient = useQueryClient();
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeDonationId, setActiveDonationId] = useState<number | null>(null);
  const [contributionError, setContributionError] = useState<string | null>(null);
  const [contributionFieldErrors, setContributionFieldErrors] = useState<Record<string, string>>(
    {},
  );
  const [isEditDonorOpen, setIsEditDonorOpen] = useState(false);
  const [donorError, setDonorError] = useState<string | null>(null);
  const [donorFieldErrors, setDonorFieldErrors] = useState<Record<string, string>>({});
  const [donorForm, setDonorForm] = useState({
    supporterType: "MonetaryDonor",
    displayName: "",
    organizationName: "",
    firstName: "",
    lastName: "",
    relationshipType: "",
    region: "",
    country: "",
    email: "",
    phone: "",
    status: "Active",
    acquisitionChannel: "",
  });
  const [contributionForm, setContributionForm] = useState({
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
  const socialMediaPath = withPathLanguage("/dashboard/social-media", i18n.resolvedLanguage);
  const processRecordingPath = withPathLanguage("/dashboard/process-recordings", i18n.resolvedLanguage);
  const homeVisitationPath = withPathLanguage("/dashboard/home-visitations", i18n.resolvedLanguage);
  const reportsPath = withPathLanguage("/dashboard/reports", i18n.resolvedLanguage);
  const navigationItems: AdminNavItem[] = [
    { label: t("sidebar.dashboard"), icon: LayoutDashboard, to: dashboardPath },
    { label: t("sidebar.socialMedia"), icon: Megaphone, to: socialMediaPath },
    { label: t("sidebar.residents"), icon: UsersRound, to: caseloadPath },
    { label: t("sidebar.donations"), icon: HeartHandshake, to: donationsPath, active: true },
    { label: t("sidebar.processRecording"), icon: ClipboardList, to: processRecordingPath },
    { label: t("sidebar.caseConferences"), icon: CalendarClock, to: homeVisitationPath },
    { label: t("sidebar.reports"), icon: FileBarChart2, to: reportsPath },
  ];

  const donorQuery = useQuery({
    queryKey: ["admin-donor-detail", supporterId],
    queryFn: () =>
      auth.authenticatedJson<DonorDetailResponse>(
        `/api/admin/donations/donors/${supporterId}`,
      ),
    enabled: Number.isFinite(supporterId),
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

  const createContributionMutation = useMutation({
    mutationFn: (payload: {
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
            supporterId,
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
        donationType: "Monetary",
        donationDate: "",
        estimatedValue: "",
        impactUnit: "Pesos",
        programArea: "",
        safehouseId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-donor-detail", supporterId] });
      queryClient.invalidateQueries({ queryKey: ["admin-donations-overview"] });
    },
    onError: (error: unknown) => {
      setContributionError(
        error instanceof Error ? error.message : "Unable to record contribution. Please try again.",
      );
    },
  });

  const updateContributionMutation = useMutation({
    mutationFn: (payload: {
      donationId: number;
      donationType: string;
      donationDate: string;
      estimatedValue: number;
      impactUnit: string;
      programArea: string;
      safehouseId: number;
    }) =>
      auth.authenticatedJson<{ donationId: number }>(
        `/api/admin/donations/contributions/${payload.donationId}`,
        {
          method: "PUT",
          body: {
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
      setIsEditOpen(false);
      setContributionError(null);
      setContributionFieldErrors({});
      setActiveDonationId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-donor-detail", supporterId] });
      queryClient.invalidateQueries({ queryKey: ["admin-donations-overview"] });
    },
    onError: (error: unknown) => {
      setContributionError(
        error instanceof Error ? error.message : "Unable to update contribution. Please try again.",
      );
    },
  });

  const updateDonorMutation = useMutation({
    mutationFn: (payload: typeof donorForm) =>
      auth.authenticatedJson<{ supporterId: number; displayName: string }>(
        `/api/admin/donations/donors/${supporterId}`,
        {
          method: "PUT",
          body: payload,
        },
      ),
    onSuccess: () => {
      setIsEditDonorOpen(false);
      setDonorError(null);
      setDonorFieldErrors({});
      queryClient.invalidateQueries({ queryKey: ["admin-donor-detail", supporterId] });
      queryClient.invalidateQueries({ queryKey: ["admin-donations-overview"] });
    },
    onError: (error: unknown) => {
      setDonorError(
        error instanceof Error ? error.message : "Unable to update donor. Please try again.",
      );
    },
  });

  const deleteContributionMutation = useMutation({
    mutationFn: (donationId: number) =>
      auth.authenticatedJson(`/api/admin/donations/contributions/${donationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-donor-detail", supporterId] });
      queryClient.invalidateQueries({ queryKey: ["admin-donations-overview"] });
    },
    onError: (error: unknown) => {
      setContributionError(
        error instanceof Error ? error.message : "Unable to delete contribution. Please try again.",
      );
    },
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
        formattedAllocation: donation.programArea
          ? formatDisplayLabel(donation.programArea)
          : "Unallocated",
      })) ?? [],
    [donorQuery.data],
  );

  const validateContributionForm = (requireAllocation: boolean) => {
    const errors: Record<string, string> = {};
    if (!contributionForm.donationType) errors.donationType = "Donation type is required.";
    if (!contributionForm.donationDate) errors.donationDate = "Donation date is required.";
    if (!contributionForm.estimatedValue) errors.estimatedValue = "Estimated value is required.";
    if (requireAllocation && !contributionForm.programArea) {
      errors.programArea = "Program area is required.";
    }
    if (requireAllocation && !contributionForm.safehouseId) {
      errors.safehouseId = "Safehouse is required.";
    }
    return errors;
  };

  const validateDonorForm = (form: typeof donorForm) => {
    const errors: Record<string, string> = {};
    if (!form.displayName.trim()) errors.displayName = "Display name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    if (!form.phone.trim()) errors.phone = "Phone is required.";
    if (!form.supporterType.trim()) errors.supporterType = "Supporter type is required.";
    if (!form.relationshipType.trim()) errors.relationshipType = "Relationship type is required.";
    if (!form.region.trim()) errors.region = "Region is required.";
    if (!form.country.trim()) errors.country = "Country is required.";
    if (!form.status.trim()) errors.status = "Status is required.";
    if (!form.acquisitionChannel.trim())
      errors.acquisitionChannel = "Acquisition channel is required.";
    return errors;
  };

  const openEditDonor = () => {
    if (!donorQuery.data) return;
    setDonorForm({
      supporterType: donorQuery.data.supporterType,
      displayName: donorQuery.data.displayName,
      organizationName: donorQuery.data.organizationName ?? "",
      firstName: donorQuery.data.firstName ?? "",
      lastName: donorQuery.data.lastName ?? "",
      relationshipType: donorQuery.data.relationshipType,
      region: donorQuery.data.region,
      country: donorQuery.data.country,
      email: donorQuery.data.email,
      phone: donorQuery.data.phone?.trim() ? donorQuery.data.phone : "000-000-0000",
      status: donorQuery.data.status,
      acquisitionChannel: donorQuery.data.acquisitionChannel,
    });
    setDonorError(null);
    setDonorFieldErrors({});
    setIsEditDonorOpen(true);
  };

  const openEditDonation = (donation: {
    donationId: number;
    donationDate: string;
    donationType: string;
    estimatedValue: number;
    programArea: string | null;
    safehouseId: number | null;
  }) => {
    setActiveDonationId(donation.donationId);
    setContributionForm({
      donationType: donation.donationType,
      donationDate: donation.donationDate.slice(0, 10),
      estimatedValue: donation.estimatedValue.toString(),
      impactUnit: "Pesos",
      programArea: donation.programArea ?? "",
      safehouseId: donation.safehouseId ? donation.safehouseId.toString() : "",
    });
    setContributionError(null);
    setContributionFieldErrors({});
    setIsEditOpen(true);
  };

  useEffect(() => {
    setContributionForm((current) => ({
      ...current,
      impactUnit: getImpactUnitForDonationType(current.donationType),
    }));
  }, [contributionForm.donationType]);

  return (
    <AdminWorkspace items={navigationItems} signOutPending={false} onSignOut={auth.logout}>
      <div className="flex flex-col gap-8">
        <header className="rounded-none border border-border bg-card px-6 py-6 shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Donor
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  {donorQuery.data?.displayName ?? "Donor details"}
                </h1>
                <Button type="button" variant="ghost" size="icon" onClick={openEditDonor}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold text-foreground">
                Donation history
              </CardTitle>
              <Button size="sm" onClick={() => setIsContributionOpen(true)}>
                + Record contribution
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead>Estimated value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donorQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Loading donation history…
                    </TableCell>
                  </TableRow>
                ) : donations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No donations recorded for this supporter yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  donations.map((donation) => (
                    <TableRow key={donation.donationId}>
                      <TableCell>{donation.formattedDate}</TableCell>
                      <TableCell>{donation.formattedType}</TableCell>
                      <TableCell>{donation.formattedAllocation}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span>{donation.formattedValue}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openEditDonation({
                                  donationId: donation.donationId,
                                  donationDate: donation.donationDate,
                                  donationType: donation.donationType,
                                  estimatedValue: donation.estimatedValue,
                                  programArea: donation.programArea,
                                  safehouseId: donation.safehouseId,
                                })
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              disabled={deleteContributionMutation.isPending}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    "Delete this contribution? This action cannot be undone.",
                                  )
                                ) {
                                  return;
                                }
                                deleteContributionMutation.mutate(donation.donationId);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isContributionOpen} onOpenChange={setIsContributionOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Record contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {contributionError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {contributionError}
              </div>
            ) : null}
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
                    <SelectValue placeholder="Select a program area" />
                  </SelectTrigger>
                  <SelectContent>
                    {(metadataQuery.data?.programAreas ?? []).map((programArea) => (
                      <SelectItem key={programArea} value={programArea}>
                        {formatDisplayLabel(programArea)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contributionFieldErrors.programArea ? (
                  <p className="text-xs text-destructive">
                    {contributionFieldErrors.programArea}
                  </p>
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
                    <SelectValue placeholder="Select a safehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {(metadataQuery.data?.safehouses ?? []).map((safehouse) => (
                      <SelectItem key={safehouse.safehouseId} value={safehouse.safehouseId.toString()}>
                        {safehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contributionFieldErrors.safehouseId ? (
                  <p className="text-xs text-destructive">
                    {contributionFieldErrors.safehouseId}
                  </p>
                ) : null}
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsContributionOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createContributionMutation.isPending}
                onClick={() => {
                  const errors = validateContributionForm(true);
                  setContributionFieldErrors(errors);
                  if (Object.keys(errors).length > 0) return;
                  createContributionMutation.mutate({
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

      <Dialog open={isEditDonorOpen} onOpenChange={setIsEditDonorOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Edit donor profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {donorError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {donorError}
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name">
                <Input
                  value={donorForm.firstName}
                  onChange={(event) => {
                    setDonorForm({ ...donorForm, firstName: event.target.value });
                    if (donorFieldErrors.firstName) {
                      setDonorFieldErrors((current) => ({ ...current, firstName: "" }));
                    }
                  }}
                />
                {donorFieldErrors.firstName ? (
                  <p className="text-xs text-destructive">{donorFieldErrors.firstName}</p>
                ) : null}
              </Field>
              <Field label="Last name">
                <Input
                  value={donorForm.lastName}
                  onChange={(event) => {
                    setDonorForm({ ...donorForm, lastName: event.target.value });
                    if (donorFieldErrors.lastName) {
                      setDonorFieldErrors((current) => ({ ...current, lastName: "" }));
                    }
                  }}
                />
                {donorFieldErrors.lastName ? (
                  <p className="text-xs text-destructive">{donorFieldErrors.lastName}</p>
                ) : null}
              </Field>
            </div>
            <Field label="Display name">
              <Input
                value={donorForm.displayName}
                onChange={(event) => {
                  setDonorForm({ ...donorForm, displayName: event.target.value });
                  if (donorFieldErrors.displayName) {
                    setDonorFieldErrors((current) => ({ ...current, displayName: "" }));
                  }
                }}
              />
              {donorFieldErrors.displayName ? (
                <p className="text-xs text-destructive">{donorFieldErrors.displayName}</p>
              ) : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <Input
                  value={donorForm.email}
                  onChange={(event) => {
                    setDonorForm({ ...donorForm, email: event.target.value });
                    if (donorFieldErrors.email) {
                      setDonorFieldErrors((current) => ({ ...current, email: "" }));
                    }
                  }}
                />
                {donorFieldErrors.email ? (
                  <p className="text-xs text-destructive">{donorFieldErrors.email}</p>
                ) : null}
              </Field>
              <Field label="Phone">
                <Input
                  value={donorForm.phone}
                  onChange={(event) => {
                    setDonorForm({ ...donorForm, phone: event.target.value });
                    if (donorFieldErrors.phone) {
                      setDonorFieldErrors((current) => ({ ...current, phone: "" }));
                    }
                  }}
                />
                {donorFieldErrors.phone ? (
                  <p className="text-xs text-destructive">{donorFieldErrors.phone}</p>
                ) : null}
              </Field>
            </div>
            <Field label="Supporter type">
              <Select
                value={donorForm.supporterType}
                onValueChange={(value) => {
                  setDonorForm({ ...donorForm, supporterType: value });
                  if (donorFieldErrors.supporterType) {
                    setDonorFieldErrors((current) => ({ ...current, supporterType: "" }));
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
              {donorFieldErrors.supporterType ? (
                <p className="text-xs text-destructive">{donorFieldErrors.supporterType}</p>
              ) : null}
            </Field>
            <Field label="Organization name (optional)">
              <Input
                value={donorForm.organizationName}
                onChange={(event) =>
                  setDonorForm({ ...donorForm, organizationName: event.target.value })
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Relationship type">
                <Select
                  value={donorForm.relationshipType}
                  onValueChange={(value) => {
                    setDonorForm({ ...donorForm, relationshipType: value });
                    if (donorFieldErrors.relationshipType) {
                      setDonorFieldErrors((current) => ({ ...current, relationshipType: "" }));
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
                      <SelectItem value={donorForm.relationshipType}>
                        {formatDisplayLabel(donorForm.relationshipType)}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {donorFieldErrors.relationshipType ? (
                  <p className="text-xs text-destructive">{donorFieldErrors.relationshipType}</p>
                ) : null}
              </Field>
              <Field label="Region">
                <Input
                  value={donorForm.region}
                  onChange={(event) => {
                    setDonorForm({ ...donorForm, region: event.target.value });
                    if (donorFieldErrors.region) {
                      setDonorFieldErrors((current) => ({ ...current, region: "" }));
                    }
                  }}
                />
                {donorFieldErrors.region ? (
                  <p className="text-xs text-destructive">{donorFieldErrors.region}</p>
                ) : null}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Country">
                <Input
                  value={donorForm.country}
                  onChange={(event) => {
                    setDonorForm({ ...donorForm, country: event.target.value });
                    if (donorFieldErrors.country) {
                      setDonorFieldErrors((current) => ({ ...current, country: "" }));
                    }
                  }}
                />
                {donorFieldErrors.country ? (
                  <p className="text-xs text-destructive">{donorFieldErrors.country}</p>
                ) : null}
              </Field>
              <Field label="Status">
                <Select
                  value={donorForm.status}
                  onValueChange={(value) => {
                    setDonorForm({ ...donorForm, status: value });
                    if (donorFieldErrors.status) {
                      setDonorFieldErrors((current) => ({ ...current, status: "" }));
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
                {donorFieldErrors.status ? (
                  <p className="text-xs text-destructive">{donorFieldErrors.status}</p>
                ) : null}
              </Field>
            </div>
            <Field label="Acquisition channel">
              <Select
                value={donorForm.acquisitionChannel}
                onValueChange={(value) => {
                  setDonorForm({ ...donorForm, acquisitionChannel: value });
                  if (donorFieldErrors.acquisitionChannel) {
                    setDonorFieldErrors((current) => ({ ...current, acquisitionChannel: "" }));
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
                    <SelectItem value={donorForm.acquisitionChannel}>
                      {formatDisplayLabel(donorForm.acquisitionChannel)}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {donorFieldErrors.acquisitionChannel ? (
                <p className="text-xs text-destructive">{donorFieldErrors.acquisitionChannel}</p>
              ) : null}
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDonorOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={updateDonorMutation.isPending}
                onClick={() => {
                  const errors = validateDonorForm(donorForm);
                  setDonorFieldErrors(errors);
                  if (Object.keys(errors).length > 0) return;
                  updateDonorMutation.mutate(donorForm);
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {contributionError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {contributionError}
              </div>
            ) : null}
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
                    <SelectValue placeholder="Select a program area" />
                  </SelectTrigger>
                  <SelectContent>
                    {(metadataQuery.data?.programAreas ?? []).map((programArea) => (
                      <SelectItem key={programArea} value={programArea}>
                        {formatDisplayLabel(programArea)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contributionFieldErrors.programArea ? (
                  <p className="text-xs text-destructive">
                    {contributionFieldErrors.programArea}
                  </p>
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
                    <SelectValue placeholder="Select a safehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {(metadataQuery.data?.safehouses ?? []).map((safehouse) => (
                      <SelectItem key={safehouse.safehouseId} value={safehouse.safehouseId.toString()}>
                        {safehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contributionFieldErrors.safehouseId ? (
                  <p className="text-xs text-destructive">
                    {contributionFieldErrors.safehouseId}
                  </p>
                ) : null}
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={updateContributionMutation.isPending || activeDonationId === null}
                onClick={() => {
                  const errors = validateContributionForm(true);
                  setContributionFieldErrors(errors);
                  if (Object.keys(errors).length > 0 || activeDonationId === null) return;
                  updateContributionMutation.mutate({
                    donationId: activeDonationId,
                    donationType: contributionForm.donationType,
                    donationDate: contributionForm.donationDate,
                    estimatedValue: Number(contributionForm.estimatedValue),
                    impactUnit: contributionForm.impactUnit,
                    programArea: contributionForm.programArea,
                    safehouseId: Number(contributionForm.safehouseId),
                  });
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminWorkspace>
  );
};

export default DonorDetail;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    {children}
  </div>
);
