import { AdminGuard } from "@/components/auth/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Admin Layout
 *
 * Wraps all /admin/* routes with:
 *   - AdminGuard (auth + is_admin check)
 *   - Sidebar navigation (desktop) + mobile drawer (in AdminHeader)
 *   - Full-screen layout (no main-site Navbar/Footer)
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-cinema-bg">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </AdminGuard>
  );
}