import { useState } from "react";
import { HandHeart, Heart, Landmark, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-beach.jpg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createPublicDonationRequest, getErrorMessage, resolveApiBaseUrl } from "@/auth/auth-api";

const Donate = () => {
  const { t } = useTranslation("donate");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    amount: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number.parseFloat(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        title: t("toast.errorTitle"),
        description: t("toast.invalidAmount"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createPublicDonationRequest(resolveApiBaseUrl(), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        amount,
      });

      toast({
        title: t("toast.title"),
        description: t("toast.description"),
      });
      setFormData({ name: "", email: "", amount: "" });
    } catch (error) {
      toast({
        title: t("toast.errorTitle"),
        description: getErrorMessage(error, t("toast.errorDescription")),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted">
        <section className="relative py-20 overflow-hidden">
          <img
            src={heroImage}
            alt={t("hero.alt")}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-primary-foreground/90 max-w-3xl mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>
        </section>

        <section className="py-14 bg-background">
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-8">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HandHeart className="h-5 w-5 text-primary" />
                  {t("form.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("form.nameLabel")}
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={t("form.namePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("form.emailLabel")}
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={t("form.emailPlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("form.amountLabel")}
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder={t("form.amountPlaceholder")}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                  >
                    {isSubmitting ? t("form.submitting") : t("form.submit")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" />
                    {t("cards.why.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  {t("cards.why.description")}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    {t("cards.operations.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  {t("cards.operations.description")}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    {t("cards.gratitude.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground leading-relaxed">
                  {t("cards.gratitude.description")}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Donate;
