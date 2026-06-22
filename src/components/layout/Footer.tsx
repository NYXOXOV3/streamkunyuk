import Link from "next/link";
import { Play } from "lucide-react";

const footerLinks = {
  Browse: [
    { label: "Movies", href: "/browse/movie" },
    { label: "Series", href: "/browse/series" },
    { label: "Anime", href: "/browse/anime" },
    { label: "Donghua", href: "/browse/donghua" },
    { label: "Micro-Drama", href: "/browse/microdrama" },
  ],
  Account: [
    { label: "My Profile", href: "/profile" },
    { label: "My List", href: "/my-list" },
    { label: "Watch History", href: "/history" },
    { label: "Subscription", href: "/profile/subscription" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-cinema-border bg-cinema-bg">
      <div className="max-w-8xl mx-auto px-4 md:px-6 py-12">
        {/* Top: Logo + Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-md bg-cinema-red flex items-center justify-center">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight group-hover:text-cinema-red transition-colors">
                StreamVault
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              Premium streaming for movies, series, anime, donghua, and
              micro-dramas. Cinematic experience, anytime, anywhere.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom: Copyright */}
        <div className="mt-10 pt-6 border-t border-cinema-border text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} StreamVault. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}