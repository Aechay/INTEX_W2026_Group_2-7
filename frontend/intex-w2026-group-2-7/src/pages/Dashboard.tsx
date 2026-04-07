import { Users, Heart, FileText, Activity, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const Dashboard = () => {
  const { t } = useTranslation("dashboard");

  const overviewCards = [
    {
      title: t("overview.totalChildren.title"),
      value: "47",
      change: t("overview.totalChildren.change"),
      icon: Users,
      color: "text-primary",
    },
    {
      title: t("overview.activeCases.title"),
      value: "23",
      change: t("overview.activeCases.change"),
      icon: FileText,
      color: "text-secondary",
    },
    {
      title: t("overview.activeDonors.title"),
      value: "312",
      change: t("overview.activeDonors.change"),
      icon: Heart,
      color: "text-coral",
    },
    {
      title: t("overview.staffMembers.title"),
      value: "45",
      change: t("overview.staffMembers.change"),
      icon: Activity,
      color: "text-palm",
    },
  ];

  const recentActivity = [
    { text: t("recentActivity.intake.text"), time: t("recentActivity.intake.time") },
    { text: t("recentActivity.donation.text"), time: t("recentActivity.donation.time") },
    { text: t("recentActivity.caseUpdate.text"), time: t("recentActivity.caseUpdate.time") },
    { text: t("recentActivity.report.text"), time: t("recentActivity.report.time") },
    { text: t("recentActivity.volunteer.text"), time: t("recentActivity.volunteer.time") },
  ];

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewCards.map((card) => (
            <Card key={card.title} className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <card.icon className={`h-8 w-8 ${card.color}`} />
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                <div className="text-sm text-muted-foreground">{card.title}</div>
                <div className="text-xs text-primary mt-1">{card.change}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">{t("recentActivity.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-sm text-foreground">{item.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
