import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  CircleAlert,
  HeartHandshake,
  LogOut,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/auth/auth-api";
import useAuth from "@/auth/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DonorChurnPredictionResponse = {
  donorId: number;
  riskScore: number;
  riskBand: string;
  modelVersion: string;
  scoredAt: string;
};

type ResidentRiskPredictionResponse = {
  residentId: number;
  predictedRisk: string;
  predictedRiskNum: number;
  flagForReview: boolean;
  modelVersion: string;
  scoredAt: string;
};

type SocialMediaPredictionRequest = {
  platform: string;
  postType: string;
  mediaType: string;
  contentTopic: string;
  sentimentTone: string;
  timeBucket: string;
  captionLength: number;
  numHashtags: number;
  mentionsCount: number;
  isCta: number;
  isStory: number;
  isBoostedFlag: number;
  followerCountAtPost: number;
  isWeekend: number;
  postHour: number;
};

type SocialMediaPredictionResponse = {
  predictedDonationPhp: number;
  modelVersion: string;
  scoredAt: string;
};

const initialPredictionRequest: SocialMediaPredictionRequest = {
  platform: "Facebook",
  postType: "ImpactStory",
  mediaType: "Photo",
  contentTopic: "DonorImpact",
  sentimentTone: "Hopeful",
  timeBucket: "Morning",
  captionLength: 120,
  numHashtags: 3,
  mentionsCount: 1,
  isCta: 1,
  isStory: 1,
  isBoostedFlag: 0,
  followerCountAtPost: 5000,
  isWeekend: 0,
  postHour: 10,
};

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value);

const formatScoreTime = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Pending";

const Dashboard = () => {
  const { t } = useTranslation("dashboard");
  const auth = useAuth();
  const [request, setRequest] = useState(initialPredictionRequest);
  const [signOutPending, setSignOutPending] = useState(false);

  const donorQuery = useQuery({
    queryKey: ["ml", "donor-churn"],
    queryFn: () =>
      auth.authenticatedJson<DonorChurnPredictionResponse[]>("/api/admin/ml/donor-churn/current?take=8"),
  });

  const residentQuery = useQuery({
    queryKey: ["ml", "resident-risk"],
    queryFn: () =>
      auth.authenticatedJson<ResidentRiskPredictionResponse[]>("/api/admin/ml/resident-risk/current?take=8"),
  });

  const socialPrediction = useMutation({
    mutationFn: (body: SocialMediaPredictionRequest) =>
      auth.authenticatedJson<SocialMediaPredictionResponse>("/api/admin/ml/social-media/predict", {
        method: "POST",
        body,
      }),
  });

  const latestScoredAt =
    donorQuery.data?.[0]?.scoredAt ?? residentQuery.data?.[0]?.scoredAt ?? socialPrediction.data?.scoredAt;
  const highRiskDonors = donorQuery.data?.filter((row) => row.riskBand === "High").length ?? 0;
  const reviewResidents = residentQuery.data?.filter((row) => row.flagForReview).length ?? 0;
  const activeModelVersion =
    socialPrediction.data?.modelVersion ??
    donorQuery.data?.[0]?.modelVersion ??
    residentQuery.data?.[0]?.modelVersion ??
    "Not loaded";

  const handleNumberChange = (field: keyof SocialMediaPredictionRequest, value: string) => {
    setRequest((current) => ({
      ...current,
      [field]: Number(value),
    }));
  };

  const handleStringChange = (field: keyof SocialMediaPredictionRequest, value: string) => {
    setRequest((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleLogout = async () => {
    setSignOutPending(true);
    try {
      await auth.logout();
    } finally {
      setSignOutPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.12),_transparent_28%),linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8">
        <section className="rounded-[2rem] border border-primary/10 bg-card/90 p-8 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
                {t("title")}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
                Retraining outputs and live inference in one place.
              </h1>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                {t("subtitle")} The batch tables below reflect the most recent nightly scoring run,
                while the social-media form calls the backend proxy for live inference.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3 text-sm shadow-sm">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Signed in
                </div>
                <div className="mt-1 font-medium text-foreground">{auth.user?.email}</div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleLogout()}
                disabled={signOutPending}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {signOutPending ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Current donor rows",
              value: donorQuery.data?.length ?? 0,
              detail: `${highRiskDonors} flagged high risk`,
              icon: HeartHandshake,
            },
            {
              title: "Resident review flags",
              value: reviewResidents,
              detail: `${residentQuery.data?.length ?? 0} residents in latest batch`,
              icon: ShieldAlert,
            },
            {
              title: "Active model version",
              value: activeModelVersion,
              detail: `Last scored ${formatScoreTime(latestScoredAt)}`,
              icon: Activity,
            },
            {
              title: "Live demo estimate",
              value:
                socialPrediction.data?.predictedDonationPhp !== undefined
                  ? formatCurrency(socialPrediction.data.predictedDonationPhp)
                  : "Run demo",
              detail: socialPrediction.data
                ? `Predicted ${formatScoreTime(socialPrediction.data.scoredAt)}`
                : "Uses the deployed social-media model",
              icon: Sparkles,
            },
          ].map((card) => (
            <Card key={card.title} className="border-primary/10 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="mt-3 text-2xl font-semibold text-foreground break-words">
                      {card.value}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle>Latest donor churn scores</CardTitle>
              </CardHeader>
              <CardContent>
                {donorQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading donor predictions...</p>
                ) : donorQuery.isError ? (
                  <ErrorBanner
                    message={getErrorMessage(
                      donorQuery.error,
                      "Could not load donor churn predictions.",
                    )}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Donor</TableHead>
                        <TableHead>Risk band</TableHead>
                        <TableHead>Risk score</TableHead>
                        <TableHead>Scored at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donorQuery.data?.map((row) => (
                        <TableRow key={row.donorId}>
                          <TableCell className="font-medium">#{row.donorId}</TableCell>
                          <TableCell>{row.riskBand}</TableCell>
                          <TableCell>{row.riskScore.toFixed(3)}</TableCell>
                          <TableCell>{formatScoreTime(row.scoredAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle>Latest resident early-warning scores</CardTitle>
              </CardHeader>
              <CardContent>
                {residentQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading resident predictions...</p>
                ) : residentQuery.isError ? (
                  <ErrorBanner
                    message={getErrorMessage(
                      residentQuery.error,
                      "Could not load resident early-warning predictions.",
                    )}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Resident</TableHead>
                        <TableHead>Predicted risk</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Scored at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {residentQuery.data?.map((row) => (
                        <TableRow key={row.residentId}>
                          <TableCell className="font-medium">#{row.residentId}</TableCell>
                          <TableCell>{row.predictedRisk}</TableCell>
                          <TableCell>{row.flagForReview ? "Flagged" : "No change"}</TableCell>
                          <TableCell>{formatScoreTime(row.scoredAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/10 shadow-sm">
            <CardHeader>
              <CardTitle>Real-time social media demo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                Use this to score a hypothetical post against the deployed model artifact. The
                backend calls the Python Function App, not the frontend directly.
              </div>

              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  socialPrediction.mutate(request);
                }}
              >
                <SelectField
                  label="Platform"
                  value={request.platform}
                  onChange={(value) => handleStringChange("platform", value)}
                  options={["Facebook", "Instagram", "TikTok", "YouTube"]}
                />
                <SelectField
                  label="Post type"
                  value={request.postType}
                  onChange={(value) => handleStringChange("postType", value)}
                  options={["ImpactStory", "FundraisingAppeal", "EventPromo", "VolunteerSpotlight"]}
                />
                <SelectField
                  label="Media type"
                  value={request.mediaType}
                  onChange={(value) => handleStringChange("mediaType", value)}
                  options={["Photo", "Carousel", "Video", "Graphic"]}
                />
                <SelectField
                  label="Content topic"
                  value={request.contentTopic}
                  onChange={(value) => handleStringChange("contentTopic", value)}
                  options={["DonorImpact", "ResidentJourney", "CampaignLaunch", "UrgentNeed"]}
                />
                <SelectField
                  label="Sentiment tone"
                  value={request.sentimentTone}
                  onChange={(value) => handleStringChange("sentimentTone", value)}
                  options={["Hopeful", "Urgent", "Grateful", "Informative"]}
                />
                <SelectField
                  label="Time bucket"
                  value={request.timeBucket}
                  onChange={(value) => handleStringChange("timeBucket", value)}
                  options={["Morning", "Afternoon", "Evening", "Night"]}
                />

                <NumberField
                  label="Caption length"
                  value={request.captionLength}
                  onChange={(value) => handleNumberChange("captionLength", value)}
                />
                <NumberField
                  label="Hashtags"
                  value={request.numHashtags}
                  onChange={(value) => handleNumberChange("numHashtags", value)}
                />
                <NumberField
                  label="Mentions"
                  value={request.mentionsCount}
                  onChange={(value) => handleNumberChange("mentionsCount", value)}
                />
                <NumberField
                  label="Follower count"
                  value={request.followerCountAtPost}
                  onChange={(value) => handleNumberChange("followerCountAtPost", value)}
                />
                <NumberField
                  label="Post hour"
                  value={request.postHour}
                  onChange={(value) => handleNumberChange("postHour", value)}
                  min={0}
                  max={23}
                />
                <SelectField
                  label="Call to action"
                  value={String(request.isCta)}
                  onChange={(value) => handleNumberChange("isCta", value)}
                  options={["0", "1"]}
                />
                <SelectField
                  label="Resident story"
                  value={String(request.isStory)}
                  onChange={(value) => handleNumberChange("isStory", value)}
                  options={["0", "1"]}
                />
                <SelectField
                  label="Boosted post"
                  value={String(request.isBoostedFlag)}
                  onChange={(value) => handleNumberChange("isBoostedFlag", value)}
                  options={["0", "1"]}
                />
                <SelectField
                  label="Weekend post"
                  value={String(request.isWeekend)}
                  onChange={(value) => handleNumberChange("isWeekend", value)}
                  options={["0", "1"]}
                />

                <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={socialPrediction.isPending}
                    className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {socialPrediction.isPending ? "Predicting..." : "Run live prediction"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setRequest(initialPredictionRequest);
                      socialPrediction.reset();
                    }}
                  >
                    Reset sample
                  </Button>
                </div>
              </form>

              {socialPrediction.isError ? (
                <ErrorBanner
                  message={getErrorMessage(
                    socialPrediction.error,
                    "The live social media prediction failed.",
                  )}
                />
              ) : null}

              {socialPrediction.data ? (
                <div className="rounded-[1.5rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Predicted donation value
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-foreground">
                    {formatCurrency(socialPrediction.data.predictedDonationPhp)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
                    <span>Model: {socialPrediction.data.modelVersion}</span>
                    <span>Scored: {formatScoreTime(socialPrediction.data.scoredAt)}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

const NumberField = ({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}) => (
  <label className="space-y-1.5">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <Input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) => (
  <label className="space-y-1.5">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClassName}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-start gap-2">
    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
    <span>{message}</span>
  </div>
);

export default Dashboard;
