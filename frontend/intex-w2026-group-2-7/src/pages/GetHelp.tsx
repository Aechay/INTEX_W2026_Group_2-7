import { useState } from "react";
import { Phone, MapPin, Shield, AlertTriangle, ExternalLink, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroBeach from "@/assets/hero-beach.jpg";

const GetHelp = () => {
  const { t } = useTranslation("getHelp");
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    location: "",
    message: "",
    contactMethod: "",
  });

  const resources = [
    {
      name: t("resources.nationalChildAbuseHotline.name"),
      phone: "1-800-422-4453",
      type: t("resources.nationalChildAbuseHotline.type"),
    },
    {
      name: t("resources.conani.name"),
      phone: "+1 (809) 567-2233",
      type: t("resources.conani.type"),
    },
    {
      name: t("resources.womensShelter.name"),
      phone: "+1 (809) 555-7890",
      type: t("resources.womensShelter.type"),
    },
    {
      name: t("resources.legalAid.name"),
      phone: "+1 (809) 555-3456",
      type: t("resources.legalAid.type"),
    },
  ];
  const emergencyContacts = [
    {
      label: "911",
      title: "Emergency Services",
      subtitle: "Police / Ambulance",
      href: "tel:911",
    },
    {
      label: "+1 (809) 200-2020",
      title: "Hope Shelter Hotline",
      subtitle: "24/7 Crisis Support",
      href: "tel:+18092002020",
    },
    {
      label: "+1 (809) 200-NINA",
      title: "National Child Helpline",
      subtitle: "CONANI Dominican Republic",
      href: "tel:+18092006462",
    },
  ];

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: t("toast.title"),
      description: t("toast.description"),
    });
    setFormData({ name: "", age: "", location: "", message: "", contactMethod: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <button
        onClick={handleQuickExit}
        className="fixed bottom-6 right-6 z-50 bg-black text-white px-6 py-3 rounded-full shadow-lg hover:bg-black/90 transition-colors font-bold text-sm border-2 border-black"
        type="button"
      >
        ✕ {t("quickExit")}
      </button>

      <div className="bg-destructive/20 text-destructive py-3 border-b border-destructive/30">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center text-sm font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {t("emergency.prefix")}{" "}
            <a href="tel:911" className="underline">
              911
            </a>{" "}
            {t("emergency.connector")}{" "}
            <a href="tel:18004224453" className="underline">
              1-800-422-4453
            </a>
          </span>
        </div>
      </div>

      <div className="bg-accent/30 py-3 border-b">
        <div className="container mx-auto px-4 text-center text-sm text-foreground">
          <Shield className="h-4 w-4 inline mr-2" />
          <strong>{t("safetyNotice.emphasis")}</strong> {t("safetyNotice.beforeQuickExit")}{" "}
          <strong>{t("quickExit")}</strong> {t("safetyNotice.afterQuickExit")}
        </div>
      </div>

      <section>
        <div
          className="relative text-primary-foreground min-h-[42vh] flex items-center"
          style={{
            backgroundImage: `url(${heroBeach})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 container mx-auto px-4 py-16 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              You Are Not Alone
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-semibold tracking-tight">
            We Are Here to Help
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-base md:text-lg text-primary-foreground/90 leading-relaxed">
            If you are in danger or have been hurt, please reach out. Everything you share is
            confidential and safe.
          </p>
        </div>
        </div>

        <div className="bg-background text-foreground">
          <div className="container mx-auto px-4 py-16 min-h-[42vh] flex flex-col justify-center">
            <h2 className="text-center text-2xl md:text-3xl font-semibold text-foreground">
              Emergency Contacts
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {emergencyContacts.map((contact) => (
                <a
                  key={contact.title}
                  href={contact.href}
                  className="group rounded-2xl border border-primary/30 bg-primary/80 text-primary-foreground px-6 py-6 text-left shadow-lg transition hover:bg-primary/90"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary-foreground/80" />
                    <span className="text-lg font-semibold">{contact.label}</span>
                  </div>
                  <p className="mt-3 text-base font-semibold">{contact.title}</p>
                  <p className="text-sm text-primary-foreground/80">{contact.subtitle}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("hero.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("hero.description")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Send className="h-5 w-5 text-primary" />
                  {t("form.title")}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{t("form.subtitle")}</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("form.nameLabel")}
                    </label>
                    <Input
                      placeholder={t("form.namePlaceholder")}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("form.ageLabel")}
                    </label>
                    <Input
                      placeholder={t("form.agePlaceholder")}
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("form.locationLabel")}
                    </label>
                    <Input
                      placeholder={t("form.locationPlaceholder")}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("form.contactMethodLabel")}
                    </label>
                    <Input
                      placeholder={t("form.contactMethodPlaceholder")}
                      value={formData.contactMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, contactMethod: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("form.messageLabel")}
                    </label>
                    <Textarea
                      placeholder={t("form.messagePlaceholder")}
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {t("form.submit")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-md border-primary/30 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Phone className="h-5 w-5 text-primary" />
                  {t("directContact.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-secondary" />
                  <div>
                    <p className="font-medium text-foreground">
                      {t("directContact.hotlineLabel")}
                    </p>
                    <a href="tel:+18095550HOPE" className="text-primary hover:underline text-sm">
                      +1 (809) 555-HOPE
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-secondary" />
                  <div>
                    <p className="font-medium text-foreground">{t("directContact.visitUs")}</p>
                    <p className="text-sm text-muted-foreground">
                      Calle Ricardo Robles Santo Domingo Distrito Nacional Dominican Republic
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GetHelp;
