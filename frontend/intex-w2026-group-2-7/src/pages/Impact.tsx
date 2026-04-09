import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Heart, Home, Shield, Sparkles, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuickExitButton from "@/components/QuickExitButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import safehouseImage from "@/assets/safehouse.avif";
import healingImage from "@/assets/healing.jpg";
import encouragementImage from "@/assets/encouragement.jpg";
import heroImage from "@/assets/hero-beach.jpg";
import { getPublicStats } from "./public-stats-api";

const FadeInSection = ({ children, delayMs = 0 }: { children: ReactNode; delayMs?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-fade ${isVisible ? "scroll-fade-visible" : ""}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
};

const Impact = () => {
  const { t } = useTranslation("impact");
  const { data: publicStats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: getPublicStats,
    staleTime: 1000 * 60 * 5,
  });

  const headlineStats = [
    { label: t("stats.girlsHelped"), value: publicStats?.girlsHelped ?? "-", icon: Users },
    { label: t("stats.yearsOfService"), value: publicStats?.yearsOfService ?? "-", icon: Activity },
    { label: t("stats.activeDonors"), value: publicStats?.activeDonors ?? "-", icon: Heart },
    {
      label: t("stats.operatingSafeHouses"),
      value: publicStats?.operatingSafeHouses ?? "-",
      icon: Home,
    },
  ];

  const pillars = [
    { key: "safety", icon: Shield, image: safehouseImage },
    { key: "healing", icon: Heart, image: healingImage },
    { key: "empowerment", icon: Sparkles, image: encouragementImage },
  ] as const;

  const previewMetrics = {
    outcomes: [
      {
        label: t("preview.outcomes.girlsReintegrated"),
        value: publicStats?.preview.outcomes.girlsReintegrated ?? "-",
      },
      {
        label: t("preview.outcomes.activeResidents"),
        value: publicStats?.preview.outcomes.activeResidents ?? 0,
      },
      {
        label: t("preview.outcomes.openCases"),
        value: publicStats?.preview.outcomes.openCases ?? 0,
      },
    ],
    progress: [
      {
        label: t("preview.progress.schoolAttendance"),
        value:
          publicStats?.preview.progress.schoolAttendance !== undefined
            ? `${publicStats.preview.progress.schoolAttendance}%`
            : "-",
      },
      {
        label: t("preview.progress.educationGrowth"),
        value:
          publicStats?.preview.progress.educationGrowth !== undefined
            ? `${publicStats.preview.progress.educationGrowth}%`
            : "-",
      },
      {
        label: t("preview.progress.processSessionsThisMonth"),
        value:
          publicStats?.preview.progress.processSessionsThisMonth !== undefined
            ? `${publicStats.preview.progress.processSessionsThisMonth}`
            : "0",
      },
    ],
    resourceUse: [
      {
        label: t("preview.resourceUse.programAllocation"),
        value:
          publicStats?.preview.resourceUse.programAllocation !== undefined
            ? `${publicStats.preview.resourceUse.programAllocation}%`
            : "-",
      },
      {
        label: t("preview.resourceUse.costPerGirl"),
        value:
          publicStats?.preview.resourceUse.costPerGirl !== undefined
            ? `DR$${publicStats.preview.resourceUse.costPerGirl}/mo`
            : "-",
      },
      {
        label: t("preview.resourceUse.recurringDonors"),
        value:
          publicStats?.preview.resourceUse.recurringDonorShare !== undefined
            ? `${publicStats.preview.resourceUse.recurringDonorShare.toFixed(1)}%`
            : "-",
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <QuickExitButton />
      <main className="flex-1 bg-muted">
        <section className="relative py-20 overflow-hidden">
          <img
            src={heroImage}
            alt={t("title")}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              {t("title")}
            </h1>
            <p className="text-primary-foreground/90 max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </section>

        <section className="py-14 bg-background">
          <div className="container mx-auto px-4">
            <FadeInSection>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {headlineStats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                    <div className="text-3xl md:text-4xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6">
              <FadeInSection>
                <Card className="shadow-sm min-h-[320px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      {t("cards.outcomes.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    {t("cards.outcomes.description")}
                    <div className="mt-5 pt-6 space-y-2">
                      {previewMetrics.outcomes.map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                          <span>{metric.label}</span>
                          <span className="font-semibold text-foreground">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>

              <FadeInSection delayMs={120}>
                <Card className="shadow-sm min-h-[320px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      {t("cards.progress.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    {t("cards.progress.description")}
                    <div className="mt-5 space-y-2">
                      {previewMetrics.progress.map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                          <span>{metric.label}</span>
                          <span className="font-semibold text-foreground">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>

              <FadeInSection delayMs={240}>
                <Card className="shadow-sm min-h-[320px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      {t("cards.resourceUse.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground leading-relaxed">
                    {t("cards.resourceUse.description")}
                    <div className="mt-5 space-y-2">
                      {previewMetrics.resourceUse.map((metric) => (
                        <div key={metric.label} className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
                          <span>{metric.label}</span>
                          <span className="font-semibold text-foreground">{metric.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeInSection>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">
              {t("pillars.title")}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {pillars.map((pillar, index) => (
                <FadeInSection key={pillar.key} delayMs={index * 120}>
                  <Card className="shadow-md overflow-hidden border-border/80 hover:shadow-lg transition-shadow min-h-[430px]">
                    <img
                      src={pillar.image}
                      alt={t(`pillars.${pillar.key}.title`)}
                      className="w-full h-48 object-cover"
                      loading="lazy"
                    />
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <pillar.icon className="h-5 w-5 text-primary" />
                        {t(`pillars.${pillar.key}.title`)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-base text-muted-foreground leading-relaxed">
                      {t(`pillars.${pillar.key}.description`)}
                    </CardContent>
                  </Card>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Impact;
