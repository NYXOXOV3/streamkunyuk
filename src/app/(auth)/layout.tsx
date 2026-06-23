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
        {/* Subtle grid pattern overlay for texture */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-cinema-red/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full animate-fade-in-up">{children}</div>
    </div>
  );
}