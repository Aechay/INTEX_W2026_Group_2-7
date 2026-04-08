import { Link } from "react-router-dom";
import { Shield, Users, Heart, HandHeart, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LandingPage from "@/components/LandingPage";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-beach.jpg";
import missionImage from "@/assets/safehouse.avif";
import { withPathLanguage } from "@/i18n/routing";

const Index = () => {
  const { t, i18n } = useTranslation("home");

  const stats = [
    { label: t("stats.childrenHelped"), value: "", icon: Users },
    { label: t("stats.yearsOfService"), value: "", icon: Shield },
    { label: t("stats.activeDonors"), value: "", icon: Heart },
    { label: t("stats.staffAndVolunteers"), value: "", icon: HandHeart },
  ];

  const services = [
    {
      title: t("services.safeShelter.title"),
      description: t("services.safeShelter.description"),
      icon: Shield,
    },
    {
      title: t("services.caseManagement.title"),
      description: t("services.caseManagement.description"),
      icon: Users,
    },
    {
      title: t("services.donorSupport.title"),
      description: t("services.donorSupport.description"),
      icon: Heart,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LandingPage />
      <Navbar />

      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt={t("hero.heroAlt")}
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            {t("hero.titlePrefix")} <span className="text-accent">{t("hero.titleAccent")}</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
            {t("hero.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8"
            >
              <a
                href="https://donate.hopeshelter.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Heart className="mr-2 h-5 w-5" /> {t("hero.secondaryAction")}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8"
            >
              <Link to={withPathLanguage("/get-help", i18n.resolvedLanguage)}>
                {t("hero.primaryAction")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                {t("mission.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {t("mission.paragraph1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("mission.paragraph2")}
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src={missionImage}
                alt={t("mission.imageAlt")}
                className="w-full h-80 object-cover"
                loading="lazy"
                width={1280}
                height={720}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-accent" />
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-primary-foreground/80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            {t("services.title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card
                key={service.title}
                className="border-none shadow-md hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
