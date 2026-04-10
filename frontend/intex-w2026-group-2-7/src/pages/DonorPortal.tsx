import { useEffect, useMemo, useState } from 'react';
import { Heart, Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuth from '@/auth/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getErrorMessage } from '@/auth/auth-api';
import { withPathLanguage } from '@/i18n/routing';

type DonationAllocationSummary = {
  programArea: string;
  amountAllocated: number;
  allocationDate: string;
  safehouseName: string;
  city: string;
  country: string;
};

type DonationHistoryItem = {
  donationId: number;
  donationDate: string;
  donationType: string;
  campaignName?: string | null;
  channelSource: string;
  currencyCode?: string | null;
  amount?: number | null;
  estimatedValue: number;
  allocations: DonationAllocationSummary[];
};

type DonorDonationsResponse = {
  email: string;
  totalDonated: number;
  totalAllocated: number;
  donations: DonationHistoryItem[];
};

/** Dominican pesos (DOP); `es-DO` shows amounts with the RD$ symbol. */
function formatDop(value: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const DonorPortal = () => {
  const { t, i18n } = useTranslation('donorPortal');
  const auth = useAuth();
  const donorName = auth.user?.displayName?.trim() || auth.user?.email?.split('@')[0] || '';
  const donatePath = useMemo(() => {
    const params = new URLSearchParams();
    const name = auth.user?.displayName?.trim() ?? "";
    const email = auth.user?.email?.trim() ?? "";
    if (name) params.set("name", name);
    if (email) params.set("email", email);
    const suffix = params.toString();
    return `${withPathLanguage("/donate", i18n.resolvedLanguage)}${suffix ? `?${suffix}` : ""}`;
  }, [auth.user?.displayName, auth.user?.email, i18n.resolvedLanguage]);
  const [history, setHistory] = useState<DonorDonationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language.startsWith('es') ? 'es-DO' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [i18n.language],
  );

  useEffect(() => {
    let isCancelled = false;

    const loadDonationHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await auth.authenticatedJson<DonorDonationsResponse>('/donor/donations');
        if (!isCancelled) {
          setHistory(response);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError(getErrorMessage(fetchError, t('errors.loadFailed')));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadDonationHistory();

    return () => {
      isCancelled = true;
    };
  }, [auth, t]);

  const allocationsByProgramArea = useMemo(() => {
    const totals = new Map<string, number>();
    history?.donations.forEach((donation) => {
      donation.allocations.forEach((allocation) => {
        totals.set(allocation.programArea, (totals.get(allocation.programArea) ?? 0) + allocation.amountAllocated);
      });
    });
    return [...totals.entries()]
      .map(([programArea, amount]) => ({ programArea, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [history]);

  const uniqueSafehouses = useMemo(() => {
    const safehouseSet = new Set<string>();
    history?.donations.forEach((donation) => {
      donation.allocations.forEach((allocation) => {
        safehouseSet.add(`${allocation.safehouseName} (${allocation.city}, ${allocation.country})`);
      });
    });
    return [...safehouseSet];
  }, [history]);

  const firstDonationYear = useMemo(() => {
    if (!history || history.donations.length === 0) {
      return null;
    }

    return history.donations
      .map((donation) => new Date(donation.donationDate).getFullYear())
      .reduce((minYear, year) => Math.min(minYear, year), Number.MAX_SAFE_INTEGER);
  }, [history]);

  const yearsSupporting = firstDonationYear ? Math.max(1, new Date().getFullYear() - firstDonationYear + 1) : 0;
  const donations = history?.donations ?? [];

  const stats = useMemo(
    () => [
      { label: t('stats.totalDonated'), value: formatDop(history?.totalDonated ?? 0) },
      { label: t('stats.donationsMade'), value: `${donations.length}` },
      { label: t('stats.yearsSupporting'), value: `${yearsSupporting}` },
    ],
    [t, history?.totalDonated, donations.length, yearsSupporting],
  );

  const donationTypeLabel = (value: string) => {
    const labels: Record<string, string> = {
      Monetary: t('labels.donationTypes.monetary'),
      InKind: t('labels.donationTypes.inKind'),
      'In-kind': t('labels.donationTypes.inKind'),
      SocialMedia: t('labels.donationTypes.socialMedia'),
      'Social Media': t('labels.donationTypes.socialMedia'),
      Skills: t('labels.donationTypes.skills'),
      Time: t('labels.donationTypes.time'),
      Volunteer: t('labels.donationTypes.time'),
    };
    return labels[value] ?? value;
  };

  const channelLabel = (value: string) => {
    const labels: Record<string, string> = {
      Manual: t('labels.channels.manual'),
      Online: t('labels.channels.online'),
      Email: t('labels.channels.email'),
      Phone: t('labels.channels.phone'),
      Event: t('labels.channels.event'),
      Referral: t('labels.channels.referral'),
      SocialMedia: t('labels.channels.socialMedia'),
      'Social Media': t('labels.channels.socialMedia'),
    };
    return labels[value] ?? value;
  };

  const programAreaLabel = (value: string) => {
    const labels: Record<string, string> = {
      wellbeing: t('labels.programAreas.wellbeing'),
      operations: t('labels.programAreas.operations'),
      transport: t('labels.programAreas.transport'),
      education: t('labels.programAreas.education'),
    };
    return labels[value.toLowerCase()] ?? value;
  };

  const safehouseLabel = (value: string) => {
    const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
    const baseLabel = t('labels.safehouses.lighthouse');
    if (normalized.startsWith("hope shelter safehouse")) {
      const suffix = value.slice("hope shelter safehouse".length).trim();
      return suffix ? `${baseLabel} ${suffix}` : baseLabel;
    }
    return value;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {donorName ? t('header.welcomeBackWithName', { name: donorName }) : t('header.welcomeBack')}
          </h1>
          <p className="mt-1 text-muted-foreground">{t('header.subtitle')}</p>
          <Button
            asChild
            className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Link to={donatePath}>{t('history.makeDonation')}</Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">{t('history.loading')}</p>
        )}

        {!isLoading && error && <p className="text-sm text-destructive">{error}</p>}

        {!isLoading && !error && donations.length === 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-primary" />
                {t('history.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{t('history.emptyTitle')}</p>
                <p className="max-w-xs text-sm text-muted-foreground">{t('history.emptyDescription')}</p>
                <Button
                  asChild
                  className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Link to={donatePath}>
                    {t('history.makeDonation')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && donations.length > 0 && (
          <>
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Landmark className="h-5 w-5 text-primary" />
                  {t('allocation.title')}
                </CardTitle>
                <CardDescription>
                  {t('allocation.totalAllocated', { amount: formatDop(history?.totalAllocated ?? 0) })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allocationsByProgramArea.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('allocation.noAllocations')}</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('allocation.table.programArea')}</TableHead>
                        <TableHead className="text-right">{t('allocation.table.amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allocationsByProgramArea.map((item) => (
                        <TableRow key={item.programArea}>
                          <TableCell className="font-medium text-foreground">
                            {programAreaLabel(item.programArea)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-foreground">
                            {formatDop(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {uniqueSafehouses.length > 0 && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {t('allocation.supporting', { list: uniqueSafehouses.join(', ') })}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-primary" />
                  {t('history.title')}
                </CardTitle>
                <CardDescription>
                  {t('history.description', { email: auth.user?.email ?? '' })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {donations.map((donation) => (
                  <div key={donation.donationId} className="rounded-md border border-border/60 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {dateFormatter.format(new Date(donation.donationDate))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('history.via', {
                            type: donationTypeLabel(donation.donationType),
                            channel: channelLabel(donation.channelSource),
                          })}
                          {donation.campaignName ? ` — ${donation.campaignName}` : ''}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {formatDop(donation.amount ?? donation.estimatedValue)}
                      </p>
                    </div>
                    {donation.allocations.length > 0 && (
                      <div className="mt-3 space-y-1">
                    {donation.allocations.map((allocation, index) => (
                      <p key={`${donation.donationId}-${index}`} className="text-sm text-muted-foreground">
                        {t('history.toSafehouse', {
                          program: programAreaLabel(allocation.programArea),
                          amount: formatDop(allocation.amountAllocated),
                          safehouse: safehouseLabel(allocation.safehouseName),
                          city: allocation.city,
                          country: allocation.country,
                        })}
                      </p>
                    ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default DonorPortal;
