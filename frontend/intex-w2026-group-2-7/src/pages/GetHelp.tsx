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
        className="fixed bottom-6 right-6 z-50 bg-destructive text-destructive-foreground px-6 py-3 rounded-full shadow-lg hover:bg-destructive/90 transition-colors font-bold text-sm"
        type="button"
      >
        ✕ {t("quickExit")}
      </button>

      <div className="bg-destructive text-destructive-foreground py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <span className="font-bold text-lg">
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

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("hero.description")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
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
            </div>

            <div className="space-y-6">
              <Card className="shadow-md border-primary/30">
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
                        {t("directContact.location")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    {t("resources.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <div
                        key={resource.name}
                        className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-foreground text-sm">{resource.name}</p>
                          <span className="text-xs text-muted-foreground">{resource.type}</span>
                        </div>
                        <a
                          href={`tel:${resource.phone.replace(/[^+\d]/g, "")}`}
                          className="text-primary hover:underline text-sm font-medium shrink-0"
                        >
                          {resource.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GetHelp;
