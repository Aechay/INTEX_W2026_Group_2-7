import { Link } from "react-router-dom";
import { Shield, Users, Heart, HandHeart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-beach.jpg";
import missionImage from "@/assets/mission-beach.jpg";

const stats = [
  { label: "Children Helped", value: "150+", icon: Users },
  { label: "Years of Service", value: "8", icon: Shield },
  { label: "Active Donors", value: "300+", icon: Heart },
  { label: "Staff & Volunteers", value: "45", icon: HandHeart },
];

const services = [
  {
    title: "Safe Shelter",
    description: "A secure, loving environment where girls can heal and grow, free from harm.",
    icon: Shield,
  },
  {
    title: "Case Management",
    description: "Professional tracking of each child's progress, education, and well-being through our secure platform.",
    icon: Users,
  },
  {
    title: "Donor Support",
    description: "Transparent donor relationships that ensure resources reach those who need them most.",
    icon: Heart,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="Peaceful Caribbean beach with palm trees"
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6 leading-tight">
            A Safe Harbor of <span className="text-accent">Hope</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
            Providing safety, healing, and brighter futures for at-risk girls in the Dominican Republic.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8">
              <Link to="/get-help">Get Help <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground text-lg px-8">
              <a href="https://donate.hopeshelter.org" target="_blank" rel="noopener noreferrer">
                <Heart className="mr-2 h-5 w-5" /> Donate
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Hope Shelter provides staff and board members with a secure, centralized platform to manage 
                children's progress and donor relationships, while offering at-risk girls in the Dominican 
                Republic trusted access to safety resources and support.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We believe every child deserves safety, love, and the chance to thrive. Through dedicated 
                case management, community partnerships, and generous donor support, we create pathways 
                from vulnerability to empowerment.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg">
              <img
                src={missionImage}
                alt="Peaceful tropical shore with palm trees"
                className="w-full h-80 object-cover"
                loading="lazy"
                width={1280}
                height={720}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-accent" />
                <div className="text-3xl md:text-4xl font-bold text-primary-foreground">{stat.value}</div>
                <div className="text-sm text-primary-foreground/80 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Help */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            How We Help
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card key={service.title} className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>
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
