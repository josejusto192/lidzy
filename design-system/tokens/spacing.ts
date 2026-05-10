// Lidzy Design System — Spacing & Border Radius Tokens

export const spacing = {
  // --- Border Radius ---
  // Base: --radius = 0.5rem (8px)
  // Derivados calculados via CSS calc()
  radius: {
    none: "0",
    sm: "calc(0.5rem - 4px)",  // 4px  → --radius-sm
    md: "calc(0.5rem - 2px)",  // 6px  → --radius-md
    base: "0.5rem",            // 8px  → --radius (base)
    lg: "0.5rem",              // 8px  → --radius-lg
    xl: "calc(0.5rem + 4px)",  // 12px → --radius-xl
    full: "9999px",
  },

  // --- Espaçamento Base (Tailwind padrão, unidade = 4px) ---
  scale: {
    0: "0",
    1: "0.25rem",   // 4px
    2: "0.5rem",    // 8px
    3: "0.75rem",   // 12px
    4: "1rem",      // 16px
    5: "1.25rem",   // 20px
    6: "1.5rem",    // 24px
    8: "2rem",      // 32px
    10: "2.5rem",   // 40px
    12: "3rem",     // 48px
    16: "4rem",     // 64px
    20: "5rem",     // 80px
    24: "6rem",     // 96px
  },
} as const
