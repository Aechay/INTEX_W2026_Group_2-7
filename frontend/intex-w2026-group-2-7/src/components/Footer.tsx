import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-accent">Hope Shelter</h3>
            <p className="text-background/70 text-sm leading-relaxed">
              Providing safety, hope, and healing for at-risk girls in the Dominican Republic.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-accent">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/" className="block text-sm text-background/70 hover:text-accent transition-colors">Home</Link>
              <Link to="/get-help" className="block text-sm text-background/70 hover:text-accent transition-colors">Get Help</Link>
              <Link to="/login" className="block text-sm text-background/70 hover:text-accent transition-colors">Staff Login</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-accent">Contact</h3>
            <div className="space-y-2 text-sm text-background/70">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                <span>+1 (809) 555-HOPE</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                <span>info@hopeshelter.org</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-secondary" />
                <span>Santo Domingo, Dominican Republic</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} Hope Shelter. All rights reserved.
          </p>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            <a href="https://donate.hopeshelter.org" target="_blank" rel="noopener noreferrer">
              <Heart className="h-4 w-4 mr-1" /> Donate Now
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
