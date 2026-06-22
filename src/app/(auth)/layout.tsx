/**
 * Auth Layout
 *
 * Wraps /login and /register with a centered, full-screen
 * cinematic background. No Navbar or Footer here.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-cinema-bg">
      {/* Background ambient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cinema-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full animate-fade-in-up">{children}</div>
    </div>
  );
}