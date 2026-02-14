import { Link } from "react-router-dom";
import nestaLogo from "@/assets/nesta-logo.png";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container px-4 py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <img src={nestaLogo} alt="Nesta Hub" className="h-10 object-contain object-left" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Curated baby care, delivered on your schedule.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-foreground mb-1">Company</h4>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-semibold text-foreground mb-1">Follow Us</h4>
            <a
              href="https://www.instagram.com/nestahub/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            © {currentYear} Nesta Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
