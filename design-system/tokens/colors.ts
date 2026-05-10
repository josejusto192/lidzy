// Lidzy Design System — Color Tokens
// Todas as cores usam o espaço oklch (perceptually uniform)
// Format: oklch(lightness saturation hue)

export const colors = {
  // --- Cores da Marca ---
  brand: {
    primary: "oklch(0.55 0.15 150)",       // Verde Lidzy principal
    primaryLight: "oklch(0.6 0.15 150)",   // Verde Lidzy claro (dark mode)
    accent: "oklch(0.95 0.05 150)",        // Verde claro (light mode)
    accentDark: "oklch(0.3 0.08 150)",     // Verde escuro (dark mode)
  },

  // --- Neutros ---
  neutral: {
    white: "oklch(1 0 0)",
    nearWhite: "oklch(0.985 0 0)",
    light: "oklch(0.97 0 0)",
    lightBorder: "oklch(0.922 0 0)",
    mid: "oklch(0.556 0 0)",
    muted: "oklch(0.708 0 0)",
    dark: "oklch(0.269 0 0)",
    darker: "oklch(0.18 0 0)",
    nearBlack: "oklch(0.145 0 0)",
  },

  // --- Semânticas (Light Mode) ---
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0 0)",
    primary: "oklch(0.55 0.15 150)",
    primaryForeground: "oklch(1 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.145 0 0)",
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0 0)",
    accent: "oklch(0.95 0.05 150)",
    accentForeground: "oklch(0.145 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    destructiveForeground: "oklch(1 0 0)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.55 0.15 150)",
  },

  // --- Semânticas (Dark Mode) ---
  dark: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.18 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    popover: "oklch(0.18 0 0)",
    popoverForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.6 0.15 150)",
    primaryForeground: "oklch(0.145 0 0)",
    secondary: "oklch(0.269 0 0)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    mutedForeground: "oklch(0.708 0 0)",
    accent: "oklch(0.3 0.08 150)",
    accentForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.5 0.2 27.325)",
    destructiveForeground: "oklch(1 0 0)",
    border: "oklch(0.269 0 0)",
    input: "oklch(0.269 0 0)",
    ring: "oklch(0.6 0.15 150)",
  },

  // --- Sidebar (Light Mode) ---
  sidebarLight: {
    background: "oklch(0.985 0 0)",
    foreground: "oklch(0.145 0 0)",
    primary: "oklch(0.55 0.15 150)",
    primaryForeground: "oklch(1 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.145 0 0)",
    border: "oklch(0.922 0 0)",
    ring: "oklch(0.55 0.15 150)",
  },

  // --- Sidebar (Dark Mode) ---
  sidebarDark: {
    background: "oklch(0.18 0 0)",
    foreground: "oklch(0.985 0 0)",
    primary: "oklch(0.6 0.15 150)",
    primaryForeground: "oklch(0.145 0 0)",
    accent: "oklch(0.269 0 0)",
    accentForeground: "oklch(0.985 0 0)",
    border: "oklch(0.269 0 0)",
    ring: "oklch(0.6 0.15 150)",
  },

  // --- Cores para Gráficos ---
  chart: {
    light: {
      1: "oklch(0.55 0.15 150)",   // Verde Lidzy
      2: "oklch(0.6 0.118 184.704)",
      3: "oklch(0.398 0.07 227.392)",
      4: "oklch(0.828 0.189 84.429)",
      5: "oklch(0.769 0.188 70.08)",
    },
    dark: {
      1: "oklch(0.6 0.15 150)",
      2: "oklch(0.696 0.17 162.48)",
      3: "oklch(0.769 0.188 70.08)",
      4: "oklch(0.627 0.265 303.9)",
      5: "oklch(0.645 0.246 16.439)",
    },
  },
} as const

export type ColorToken = keyof typeof colors
