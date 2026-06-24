import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Footer } from "@/components/layout/Footer";

/**
 * Main User Layout
 *
 * Wraps all user-facing pages (home, browse, watch, profile, etc.)
 * with the Navbar, content area, and Footer. Mobile devices get
 * a bottom navigation bar via <MobileNav />.
 */

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-cinema-bg">
      <Navbar />

      {/* Main content — bottom padding for mobile nav (h-14) */}
      <main className="flex-1 pb-[68px] lg:pb-0">{children}</main>

      <div className="hidden lg:block mt-auto">
        <Footer />
      </div>

      <MobileNav />
    </div>
  );
}