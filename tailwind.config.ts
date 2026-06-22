import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Tailwind Configuration — Streaming Platform (Cinema-Dark)
 *
 * COLOR SYSTEM:
 *   All shadcn/ui tokens (background, foreground, card, etc.) are defined
 *   as CSS custom properties in globals.css using the oklch color space.
 *   This file bridges them into Tailwind utility classes.
 *
 *   Additional cinema-specific tokens are added under the `cinema-*` prefix
 *   for use in custom components (hero banners, overlays, premium badges).
 *
 * ANIMATION:
 *   Uses tailwindcss-animate for enter/exit animations.
 *   Custom keyframes are defined for carousel slides and fade effects.
 */

const config: Config = {
  darkMode: "class",

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      /* ------------------------------------------------------------------
       * shadcn/ui color bridge
       * These map to the CSS custom properties defined in globals.css
       * ------------------------------------------------------------------ */
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* ------------------------------------------------------------------
         * Cinema-specific color tokens
         * Use these for custom components (hero, overlays, premium badges)
         * ------------------------------------------------------------------ */
        cinema: {
          bg: "var(--cinema-bg)",
          surface: "var(--cinema-surface)",
          elevated: "var(--cinema-elevated)",
          red: "var(--cinema-red)",
          "red-hover": "var(--cinema-red-hover)",
          gold: "var(--cinema-gold)",
          muted: "var(--cinema-muted)",
          border: "var(--cinema-border)",
          overlay: "var(--cinema-overlay)",
        },
      },

      /* ------------------------------------------------------------------
       * Border radius
       * ------------------------------------------------------------------ */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /* ------------------------------------------------------------------
       * Custom animations for streaming UI
       * ------------------------------------------------------------------ */
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },

      animation: {
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
      },

      /* ------------------------------------------------------------------
       * Spacing & sizing tokens
       * ------------------------------------------------------------------ */
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },

      /* ------------------------------------------------------------------
       * Max width for content containers
       * ------------------------------------------------------------------ */
      maxWidth: {
        "8xl": "88rem",
      },

      /* ------------------------------------------------------------------
       * Backdrop blur for overlays
       * ------------------------------------------------------------------ */
      backdropBlur: {
        xs: "2px",
      },
    },
  },

  plugins: [tailwindcssAnimate],
};

export default config;