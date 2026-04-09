import { useEffect, useRef, useState, type ReactNode } from "react";
import { Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuickExitButton from "@/components/QuickExitButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImage from "@/assets/hero-beach.jpg";

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

const Resources = () => {
  const { t } = useTranslation("resources");
  const resourceContacts = t("resourceContacts", { returnObjects: true }) as Array<{
    name: string;
    phone: string;
    type: string;
  }>;
  const safetySteps = t("safetySteps", { returnObjects: true }) as Array<{
    title: string;
    description: string;
  }>;

  const faqSections = t("faqSections", { returnObjects: true }) as Array<{
    title: string;
    items: Array<{
      question: string;
      paragraphs: string[];
      list?: Array<
        | string
        | {
            text: string;
            links?: Array<{ label: string; href: string }>;
          }
      >;
      resource?: { label: string; href?: string };
    }>;
  }>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <QuickExitButton />

      <main className="flex-1 bg-muted">
        <section className="relative py-20 overflow-hidden">
          <img
            src={heroImage}
            alt={t("hero.imageAlt")}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-primary-foreground/90 max-w-3xl mx-auto">
              {t("hero.description")}
            </p>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              {t("sections.resourceContactsTitle")}
            </h2>
            <div className="grid gap-8 lg:grid-cols-4">
              {resourceContacts.map((resource, index) => (
                <FadeInSection key={resource.name} delayMs={index * 90}>
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Phone className="h-5 w-5 text-primary" />
                        {resource.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{resource.type}</p>
                    </CardHeader>
                    <CardContent>
                      <a
                        href={`tel:${resource.phone.replace(/[^+\d]/g, "")}`}
                        className="text-primary font-semibold hover:underline"
                      >
                        {resource.phone}
                      </a>
                    </CardContent>
                  </Card>
                </FadeInSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              {t("sections.faqTitle")}
            </h2>
            <div className="space-y-6">
              {faqSections.map((section) => (
                <div key={section.title} className="bg-background rounded-2xl shadow-sm border">
                  <div className="px-6 py-5 border-b">
                    <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
                  </div>
                  <div className="px-6">
                    <Accordion type="single" collapsible>
                      {section.items.map((item) => (
                        <AccordionItem
                          key={item.question}
                          value={`${section.title}-${item.question}`}
                        >
                          <AccordionTrigger className="text-left text-foreground">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.paragraphs.map((paragraph) => (
                              <p key={paragraph} className="mb-3">
                                {paragraph}
                              </p>
                            ))}
                            {item.list ? (
                              <ul className="list-disc list-inside space-y-2 mb-3">
                                {item.list.map((listItem) =>
                                  typeof listItem === "string" ? (
                                    <li key={listItem}>{listItem}</li>
                                  ) : (
                                    <li key={listItem.text}>
                                      {listItem.text}{" "}
                                      {listItem.links?.map((link, index) => (
                                        <span key={link.href}>
                                          {index > 0 ? ` ${t("listLinkSeparator")} ` : null}
                                          <a
                                            href={link.href}
                                            className="text-primary hover:underline"
                                          >
                                            {link.label}
                                          </a>
                                        </span>
                                      ))}
                                    </li>
                                  ),
                                )}
                              </ul>
                            ) : null}
                            {item.resource ? (
                              <p>
                                {t("resourceLabel")}{" "}
                                {item.resource.href ? (
                                  <a
                                    href={item.resource.href}
                                    target={item.resource.href.startsWith("http") ? "_blank" : undefined}
                                    rel={
                                      item.resource.href.startsWith("http")
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
                                    className="text-primary hover:underline"
                                  >
                                    {item.resource.label}
                                  </a>
                                ) : (
                                  item.resource.label
                                )}
                              </p>
                            ) : null}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-muted-foreground">
              {t("closing")}
            </p>
          </div>
        </section>

        <section className="py-12 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              {t("sections.safetyTitle")}
            </h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {safetySteps.map((step, index) => (
                <FadeInSection key={step.title} delayMs={index * 120}>
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {step.description}
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

export default Resources;
