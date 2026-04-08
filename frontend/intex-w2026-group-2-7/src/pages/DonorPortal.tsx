import { Heart, LogOut } from 'lucide-react';
import useAuth from '@/auth/useAuth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const DonorPortal = () => {
  const auth = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back{auth.user?.email ? `, ${auth.user.email.split('@')[0]}` : ''}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Thank you for your continued support of Hope Shelter.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void auth.logout()}
            className="shrink-0"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Impact summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Donated', value: '—' },
            { label: 'Donations Made', value: '—' },
            { label: 'Years Supporting', value: '—' },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="pt-6">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Donation history */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-primary" />
              Donation History
            </CardTitle>
            <CardDescription>
              Your full giving history will appear here once connected to the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No donations yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Your donation history will appear here. Every gift makes a difference in the lives of at-risk girls in the Dominican Republic.
              </p>
              <Button
                asChild
                className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <a href="https://donate.hopeshelter.org" target="_blank" rel="noopener noreferrer">
                  Make a Donation
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default DonorPortal;
