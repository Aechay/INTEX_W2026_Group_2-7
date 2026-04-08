import { useEffect } from "react";
import { Cookie, HeartHandshake, Lock, Mail, Scale, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withPathLanguage } from "@/i18n/routing";
import { useTranslation } from "react-i18next";

const summaryCards = [
  {
    icon: UserRound,
    title: "Account data",
    body: "We process the information needed to create your account, sign you in, and associate your profile with your personal donation history.",
  },
  {
    icon: HeartHandshake,
    title: "Donation records",
    body: "We track your donations so you can view your giving history and so Hope Shelter can maintain accurate charitable records.",
  },
  {
    icon: Cookie,
    title: "Necessary cookies only",
    body: "We use only necessary cookies and similar browser storage for sessions, security, and preferences. We do not use marketing cookies or website analytics trackers.",
  },
] as const;

const informationCollected = [
  "Account details such as your name, display name, email address, and credentials or external login details when you choose a third-party sign-in provider.",
  "Donation information such as donation dates, amounts or estimated values, recurring status, and related campaign or source details linked to your supporter record.",
  "Support communications you send us about your account, donations, or donor portal access.",
  "Technical and security information such as browser details, timestamps, session identifiers, and similar information needed to operate and secure the site.",
] as const;

const howWeUseData = [
  "Create, authenticate, and manage donor accounts.",
  "Display and maintain your donation history inside the donor portal.",
  "Send service communications such as password reset messages, account security notices, and essential support replies.",
  "Protect the website, prevent misuse, troubleshoot issues, and keep our systems secure.",
  "Maintain accounting, tax, audit, fraud-prevention, and other legally required records connected to charitable donations.",
  "Support internal donor stewardship and operational planning without using third-party website analytics trackers.",
] as const;

const lawfulBases = [
  {
    title: "Contract",
    body: "We process personal data as needed to create your account, sign you in, and provide the donor portal features you request.",
  },
  {
    title: "Legitimate interests",
    body: "We process data to secure the site, manage donor relationships responsibly, prevent abuse, and keep accurate organizational records.",
  },
  {
    title: "Legal obligations",
    body: "We retain and use certain records where we must comply with applicable accounting, tax, audit, and lawful disclosure requirements.",
  },
] as const;

const sharingCategories = [
  "Cloud hosting, database, and infrastructure providers that help us operate the website and donor portal.",
  "Email and authentication providers that support password resets, login, and account security.",
  "Professional advisers, auditors, regulators, law enforcement, or courts when disclosure is legally required or necessary to protect rights and safety.",
  "Third-party donation services you choose to use outside this site. If you follow a link to a separate donation page, that service may have its own privacy notice.",
] as const;

const retentionRules = [
  "Account information is kept while your account remains active and for a limited period afterward where needed for reactivation, security, dispute handling, or legal claims.",
  "Donation records may be kept longer when necessary for charitable recordkeeping, accounting, tax, audit, fraud-prevention, or other legal obligations.",
  "Session cookies and session storage typically expire when you log out, close your browser, or the session otherwise ends.",
  "Preference cookies and similar browser storage may remain until you change your preferences or clear them from your browser.",
] as const;

const rights = [
  "Request access to the personal data we hold about you.",
  "Ask us to correct inaccurate or incomplete information.",
  "Request deletion of your personal data in certain circumstances.",
  "Ask us to restrict or object to certain processing, especially where we rely on legitimate interests.",
  "Request a portable copy of certain data you provided to us.",
  "Lodge a complaint with your local data protection authority if you believe your rights have been violated.",
] as const;

const PrivacyPolicy = () => {
  const { i18n, t } = useTranslation("common");
  const localizedLoginPath = withPathLanguage("/login", i18n.resolvedLanguage);

  useEffect(() => {
    document.title = "Privacy Policy | Hope Shelter";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b bg-muted/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsla(var(--primary),0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_hsla(var(--secondary),0.16),_transparent_40%)]" />
          <div className="relative container mx-auto px-4 py-16 md:py-20">
            <div className="max-w-4xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Effective date: April 8, 2026
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Privacy Policy
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                  This Privacy Policy explains how Hope Shelter collects, uses, stores, and
                  shares personal data through this website and donor portal. It is designed for
                  a charitable organization that allows supporters to create accounts and track
                  their own donations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4">
            <div className="grid gap-4 md:grid-cols-3">
              {summaryCards.map((card) => (
                <Card key={card.title} className="border-border/70 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                      <card.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{card.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,0.9fr)]">
              <div className="space-y-6">
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Who We Are</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <p>
                      Hope Shelter is the controller of the personal data described in this policy
                      for the website and donor portal. Our public-facing site helps supporters
                      learn about our mission, and registered donors can access a secure area to
                      review their own donation history.
                    </p>
                    <p>
                      If you have an account, we use your information primarily to let you sign in,
                      keep your session secure, and show the donations associated with you.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Personal Data We Collect</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                      {informationCollected.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>How We Use Personal Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                      {howWeUseData.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Lawful Bases for Processing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lawfulBases.map((basis) => (
                      <div key={basis.title} className="rounded-2xl bg-muted/70 p-4">
                        <h3 className="font-semibold text-foreground">{basis.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          {basis.body}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Cookies and Similar Technologies</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <p>
                      We use only necessary cookies and similar browser storage technologies to run
                      the site. These are used for functions such as login and session handling,
                      security, and remembering preferences like language or appearance settings.
                    </p>
                    <p>
                      We do not use marketing cookies, cross-site advertising trackers, or website
                      analytics tools on this site.
                    </p>
                    <p>
                      If we introduce optional cookies in the future, we will update this page and
                      request consent where the law requires it.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>How We Share Personal Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                      {sharingCategories.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      We do not sell personal data and we do not share it for behavioral advertising.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>International Transfers</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <p>
                      Hope Shelter operates from the United States and may use service providers
                      that process data in the United States or other countries outside your home
                      jurisdiction. If you access the site from the EEA, UK, or Switzerland, your
                      personal data may be transferred internationally.
                    </p>
                    <p>
                      Where required by law, we will rely on appropriate safeguards for those
                      transfers, such as contractual protections or other recognized transfer
                      mechanisms.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Retention</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                      {retentionRules.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Your Rights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      If GDPR or similar privacy laws apply to you, you may have the right to:
                    </p>
                    <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
                      {rights.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm leading-6 text-muted-foreground">
                      To exercise these rights, contact us using the details below. We may need to
                      verify your identity before acting on a request.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Security and Automated Decisions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <p>
                      We use reasonable technical and organizational measures to protect personal
                      data, but no online service can guarantee absolute security.
                    </p>
                    <p>
                      We may review donation information internally to support donor stewardship and
                      operational planning. We do not use solely automated decision-making in the
                      donor portal that produces legal or similarly significant effects on you.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Contact Hope Shelter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <p>
                      If you have privacy questions or want to exercise your rights, contact us at:
                    </p>
                    <div className="rounded-2xl bg-muted/70 p-4">
                      <p className="font-medium text-foreground">Hope Shelter</p>
                      <p>info@hopeshelter.org</p>
                      <p>+1 (809) 555-HOPE</p>
                      <p>Santo Domingo, Dominican Republic</p>
                    </div>
                    <p>
                      If you are an existing donor, using the same email address as your account
                      will help us respond more quickly.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Scale className="h-5 w-5 text-primary" />
                      Quick Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>
                      The site is designed to let supporters sign in and view their own donations.
                    </p>
                    <p>
                      We use necessary cookies and similar storage for login, security, and
                      preferences only.
                    </p>
                    <p>We do not use site analytics trackers or marketing cookies.</p>
                    <p>We do not sell personal data.</p>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Account Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
                    <p>
                      You can review your donor account by signing in to the donor portal.
                    </p>
                    <Link
                      to={localizedLoginPath}
                      className="inline-flex rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      {t("nav.signIn")}
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle>Updates to This Policy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>
                      We may update this Privacy Policy from time to time to reflect changes to the
                      service, legal requirements, or how we handle personal data.
                    </p>
                    <p>
                      When we do, we will post the updated version on this page and revise the
                      effective date above.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
