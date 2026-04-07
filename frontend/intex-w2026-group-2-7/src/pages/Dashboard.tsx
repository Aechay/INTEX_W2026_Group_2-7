import { Users, Heart, FileText, Activity, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const overviewCards = [
  { title: "Total Children", value: "47", change: "+3 this month", icon: Users, color: "text-primary" },
  { title: "Active Cases", value: "23", change: "12 in progress", icon: FileText, color: "text-secondary" },
  { title: "Active Donors", value: "312", change: "+18 this quarter", icon: Heart, color: "text-coral" },
  { title: "Staff Members", value: "45", change: "All active", icon: Activity, color: "text-palm" },
];

const recentActivity = [
  { text: "New intake form submitted for Maria G.", time: "2 hours ago", type: "intake" },
  { text: "Donor Sarah K. made a recurring donation of $150", time: "5 hours ago", type: "donation" },
  { text: "Case #1042 updated — Educational milestone reached", time: "1 day ago", type: "case" },
  { text: "Monthly report generated for March 2026", time: "2 days ago", type: "report" },
  { text: "New volunteer application from Juan R.", time: "3 days ago", type: "volunteer" },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here's an overview of Hope Shelter.</p>
        </div>

        {/* Overview Cards */}
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

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
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
