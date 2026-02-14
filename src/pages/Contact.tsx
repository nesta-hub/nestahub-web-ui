import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, ChevronRight, MapPin, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import contactHero from "@/assets/contact-hero.jpg";

function MobileContact() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Contact Us</h1>

      {/* Chat */}
      <section className="space-y-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Chat</span>
        <a href="https://wa.me/2347081940881" target="_blank" rel="noopener noreferrer">
          <Card className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">WhatsApp</p>
              <p className="text-xs text-muted-foreground">Start a conversation on WhatsApp</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Card>
        </a>
      </section>

      {/* Call */}
      <section className="space-y-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Call</span>
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">07081940881</span>
          <Button variant="outline" size="sm" asChild>
            <a href="tel:07081940881">
              <Phone className="w-4 h-4" />
              Call
            </a>
          </Button>
        </Card>
      </section>

      {/* Email */}
      <section className="space-y-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Email</span>
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm font-medium">hello@nestahub.ng</span>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:hello@nestahub.ng">
              <Mail className="w-4 h-4" />
              Email
            </a>
          </Button>
        </Card>
      </section>
    </div>
  );
}

function DesktopContact() {
  return (
    <div className="min-h-[calc(100vh-5rem)]">
      {/* Two-column split layout */}
      <div className="flex min-h-[calc(100vh-5rem)]">
        {/* Left: Hero image */}
        <div className="hidden lg:block w-1/2 relative">
          <img
            src={contactHero}
            alt="Mother and baby"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/15 to-background/40" />
        </div>

        {/* Right: Contact info */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 py-16">
          <div className="max-w-md w-full space-y-10">
            {/* Header */}
            <div>
              <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">Get in Touch</p>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Contact Us
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                We'd love to hear from you. Reach out through any of the channels below and we'll respond as soon as possible.
              </p>
            </div>

            {/* Contact methods */}
            <div className="space-y-4">
              {/* WhatsApp */}
              <a href="https://wa.me/2347081940881" target="_blank" rel="noopener noreferrer" className="group block">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-600 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Chat on WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Quick replies, usually within minutes</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </a>

              {/* Phone */}
              <a href="tel:07081940881" className="group block">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Call Us</p>
                    <p className="text-sm text-muted-foreground">07081940881</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </a>

              {/* Email */}
              <a href="mailto:hello@nestahub.ng" className="group block">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Email Us</p>
                    <p className="text-sm text-muted-foreground">hello@nestahub.ng</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            </div>

            {/* Info bar */}
            <div className="flex items-center gap-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-foreground">Mon – Sat</p>
                  <p className="text-xs text-muted-foreground">8 AM – 6 PM WAT</p>
                </div>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-foreground">Lagos</p>
                  <p className="text-xs text-muted-foreground">Nigeria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const isMobile = useIsMobile();

  return (
    <Layout>
      {isMobile ? <MobileContact /> : <DesktopContact />}
    </Layout>
  );
}
