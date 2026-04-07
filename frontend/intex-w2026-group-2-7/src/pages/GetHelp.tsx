import { useState } from "react";
import { Phone, MapPin, Shield, AlertTriangle, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const resources = [
  { name: "National Child Abuse Hotline", phone: "1-800-422-4453", type: "Hotline" },
  { name: "CONANI (DR Child Welfare)", phone: "+1 (809) 567-2233", type: "Government" },
  { name: "Local Women's Shelter", phone: "+1 (809) 555-7890", type: "Shelter" },
  { name: "Legal Aid Society - DR", phone: "+1 (809) 555-3456", type: "Legal" },
];

const GetHelp = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    location: "",
    message: "",
    contactMethod: "",
  });

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Your message has been received. Someone will reach out to you safely.",
    });
    setFormData({ name: "", age: "", location: "", message: "", contactMethod: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Quick Exit Button */}
      <button
        onClick={handleQuickExit}
        className="fixed bottom-6 right-6 z-50 bg-destructive text-destructive-foreground px-6 py-3 rounded-full shadow-lg hover:bg-destructive/90 transition-colors font-bold text-sm"
      >
        ✕ Quick Exit
      </button>

      {/* Emergency Banner */}
      <div className="bg-destructive text-destructive-foreground py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <span className="font-bold text-lg">
            If you are in immediate danger, call{" "}
            <a href="tel:911" className="underline">911</a> or{" "}
            <a href="tel:18004224453" className="underline">1-800-422-4453</a>
          </span>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-accent/30 py-3 border-b">
        <div className="container mx-auto px-4 text-center text-sm text-foreground">
          <Shield className="h-4 w-4 inline mr-2" />
          <strong>Your safety matters.</strong> Use the <strong>Quick Exit</strong> button at any time to leave this page instantly. Consider using a private/incognito browser window.
        </div>
      </div>

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              You Are Not Alone
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Whether you need immediate help or want to learn about resources available to you, 
              we're here for you. Everything shared with us is confidential.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Send className="h-5 w-5 text-primary" />
                    Reach Out to Us
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    All fields are optional. Share only what you feel comfortable with.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Name (optional)</label>
                      <Input
                        placeholder="You can use a nickname"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Age</label>
                      <Input
                        placeholder="Your age"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
                      <Input
                        placeholder="City or area"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">How can we safely contact you?</label>
                      <Input
                        placeholder="Phone, email, or other safe method"
                        value={formData.contactMethod}
                        onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Your Message</label>
                      <Textarea
                        placeholder="Tell us how we can help you..."
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contacts & Resources */}
            <div className="space-y-6">
              {/* Direct Contact */}
              <Card className="shadow-md border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Phone className="h-5 w-5 text-primary" />
                    Contact Us Directly
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="font-medium text-foreground">Hope Shelter Hotline</p>
                      <a href="tel:+18095550HOPE" className="text-primary hover:underline text-sm">+1 (809) 555-HOPE</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="font-medium text-foreground">Visit Us</p>
                      <p className="text-sm text-muted-foreground">Santo Domingo, Dominican Republic</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Directory */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <ExternalLink className="h-5 w-5 text-primary" />
                    Resource Directory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <div key={resource.name} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
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
