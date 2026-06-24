import Link from "next/link";
import { Play } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cinema-bg flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-cinema-red/10 flex items-center justify-center mb-6">
        <Play className="w-8 h-8 text-cinema-red/60 ml-0.5" />
      </div>
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-muted-foreground mb-6">Halaman tidak ditemukan</p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cinema-red hover:bg-cinema-red-hover text-white text-sm font-medium transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
