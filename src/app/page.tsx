import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Lock,
  Crown,
  Film,
  Tv,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full h-[60vh] min-h-[400px] overflow-hidden">
        {/* Simulated backdrop */}
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-bg via-cinema-surface to-cinema-bg" />

        {/* Gradient overlays */}
        <div className="absolute inset-0 cinema-gradient-bottom" />
        <div className="absolute inset-0 cinema-gradient-right" />

        <div className="relative z-10 flex flex-col justify-end h-full max-w-8xl mx-auto px-6 pb-12">
          <Badge className="w-fit mb-4 bg-cinema-red text-white border-none text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 mr-1" />
            Featured
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-3">
            StreamVault
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mb-6">
            Phase 1 Foundation Active — Cinema-Dark Theme, Supabase SDK,
            Video.js, and all core dependencies are installed and configured.
          </p>

          <div className="flex items-center gap-3">
            <Button
              size="lg"
              className="bg-cinema-red hover:bg-cinema-red-hover text-white glow-red font-semibold"
            >
              <Play className="w-5 h-5 mr-2" />
              Play
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10"
            >
              More Info
            </Button>
          </div>
        </div>
      </section>

      {/* ===== THEME VERIFICATION GRID ===== */}
      <section className="max-w-8xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Foundation Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 — Dark Theme */}
          <Card className="bg-cinema-surface border-cinema-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Cinema-Dark Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Deep blue-black palette with Netflix-inspired crimson accent.</p>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-cinema-bg border border-cinema-border" title="--cinema-bg" />
                <div className="w-6 h-6 rounded-full bg-cinema-surface border border-cinema-border" title="--cinema-surface" />
                <div className="w-6 h-6 rounded-full bg-cinema-elevated border border-cinema-border" title="--cinema-elevated" />
                <div className="w-6 h-6 rounded-full bg-cinema-red" title="--cinema-red" />
                <div className="w-6 h-6 rounded-full bg-cinema-gold" title="--cinema-gold" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Supabase */}
          <Card className="bg-cinema-surface border-cinema-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Supabase SDK
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  @supabase/supabase-js
                </code>{" "}
                +{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  @supabase/ssr
                </code>
              </p>
              <p>Browser, Server, and Admin clients configured.</p>
            </CardContent>
          </Card>

          {/* Card 3 — Video Player */}
          <Card className="bg-cinema-surface border-cinema-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Video.js + HLS.js
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  video.js@8
                </code>{" "}
                +{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  hls.js@1.6
                </code>
              </p>
              <p>HLS/DASH streaming with custom cinema skin.</p>
            </CardContent>
          </Card>

          {/* Card 4 — State Management */}
          <Card className="bg-cinema-surface border-cinema-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                State Management
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  zustand@5
                </code>{" "}
                +{" "}
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  @tanstack/react-query@5
                </code>
              </p>
              <p>Client state + server cache layer ready.</p>
            </CardContent>
          </Card>

          {/* Card 5 — UI Components */}
          <Card className="bg-cinema-surface border-cinema-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                shadcn/ui (45+)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>New York style, Lucide icons, full component library.</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">Button</Badge>
                <Badge variant="outline" className="text-xs">Card</Badge>
                <Badge variant="outline" className="text-xs">Dialog</Badge>
                <Badge variant="outline" className="text-xs">Input</Badge>
                <Badge variant="outline" className="text-xs">Skeleton</Badge>
                <Badge variant="outline" className="text-xs">Toast</Badge>
                <Badge variant="outline" className="text-xs">Dropdown</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card 6 — Content Types */}
          <Card className="bg-cinema-surface border-cinema-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Content Types
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1"><Film className="w-3 h-3" /> Movie</Badge>
                <Badge variant="secondary" className="gap-1"><Tv className="w-3 h-3" /> Series</Badge>
                <Badge variant="secondary" className="gap-1"><Sparkles className="w-3 h-3" /> Anime</Badge>
                <Badge variant="secondary" className="gap-1"><Tv className="w-3 h-3" /> Donghua</Badge>
                <Badge variant="secondary" className="gap-1"><Film className="w-3 h-3" /> Micro-drama</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== PREMIUM LOCK OVERLAY DEMO ===== */}
      <section className="max-w-8xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Access Control Preview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free episode */}
          <Card className="bg-cinema-surface border-cinema-border overflow-hidden">
            <div className="relative h-40 bg-gradient-to-br from-cinema-elevated to-cinema-surface flex items-center justify-center">
              <Skeleton className="h-full w-full absolute inset-0" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Play className="w-10 h-10 text-white/80" />
                <span className="text-sm text-white/60">Episode 1</span>
              </div>
              <Badge className="absolute top-2 left-2 bg-emerald-600 text-white text-xs border-none">
                Free
              </Badge>
            </div>
            <CardContent className="pt-3">
              <p className="text-sm font-medium text-foreground">Episode 1 — The Beginning</p>
              <p className="text-xs text-muted-foreground mt-1">Available to all users</p>
            </CardContent>
          </Card>

          {/* Locked episode */}
          <Card className="bg-cinema-surface border-cinema-border overflow-hidden">
            <div className="relative h-40 bg-gradient-to-br from-cinema-elevated to-cinema-surface flex items-center justify-center">
              <Skeleton className="h-full w-full absolute inset-0" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Lock className="w-10 h-10 text-cinema-gold/80" />
                <span className="text-sm text-white/60">Episode 3</span>
              </div>
              <Badge className="absolute top-2 left-2 bg-cinema-gold text-black text-xs border-none font-semibold">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
              {/* Simulated overlay */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                <Lock className="w-8 h-8 text-cinema-gold" />
                <p className="text-sm font-semibold text-white">Subscriber Only</p>
              </div>
            </div>
            <CardContent className="pt-3">
              <p className="text-sm font-medium text-foreground">Episode 3 — The Revelation</p>
              <p className="text-xs text-cinema-gold mt-1 font-medium">Upgrade to Premium to unlock</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== GRADIENT & GOLD TEXT DEMO ===== */}
      <section className="max-w-8xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">
          Premium Accents
        </h2>
        <div className="bg-cinema-surface border border-cinema-border rounded-lg p-6 space-y-4">
          <p className="text-gradient-gold text-3xl font-bold">Gold Gradient Text</p>
          <Button className="bg-cinema-red hover:bg-cinema-red-hover text-white glow-red">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        </div>
      </section>
    </div>
  );
}