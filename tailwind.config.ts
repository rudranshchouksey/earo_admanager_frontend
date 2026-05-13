import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
         sans: ["Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        violet: {
          700: "hsl(var(--violet-700))",
          800: "hsl(var(--violet-800))",
          900: "hsl(var(--violet-900))",
        },
        pink: {
          200: "hsl(var(--pink-200))",
          800: "hsl(var(--pink-800))",
          900: "hsl(var(--pink-900))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slide-out-left": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(-100px)", opacity: "0" },
        },
        "slide-in-right": {
          from: { transform: "translateX(50px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.9" },
        },
       "fade-up": {
         "0%": { opacity: "0", transform: "translateY(30px)" },
         "100%": { opacity: "1", transform: "translateY(0)" },
       },
       "fade-left": {
         "0%": { opacity: "0", transform: "translateX(-30px)" },
         "100%": { opacity: "1", transform: "translateX(0)" },
       },
       "fade-right": {
         "0%": { opacity: "0", transform: "translateX(30px)" },
         "100%": { opacity: "1", transform: "translateX(0)" },
       },
       "stagger-in": {
         "0%": { opacity: "0", transform: "translateY(20px)" },
         "100%": { opacity: "1", transform: "translateY(0)" },
       },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-out-left": "slide-out-left 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out 0.15s forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
       "fade-up": "fade-up 0.6s ease-out forwards",
       "fade-left": "fade-left 0.6s ease-out forwards",
       "fade-right": "fade-right 0.6s ease-out forwards",
       "stagger-in": "stagger-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
