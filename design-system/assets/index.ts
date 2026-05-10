// Lidzy Design System — Asset Paths
// Todos os caminhos são relativos à pasta /public

export const assets = {
  logos: {
    // Logos horizontais (PNG/JPG)
    lightJpg: "/images/logo-light.jpg",
    darkJpg: "/images/logo-dark.jpg",

    // Logos horizontais (SVG — preferidos em produção)
    lightSvg: "/images/logo-light.svg",
    darkSvg: "/images/logo-dark.svg",

    // Logos quadrados (para avatares, favicons, etc.)
    squareLight: "/images/logo-square-light.svg",
    squareDark: "/images/logo-square-dark.svg",

    // Logo isolado (sem fundo, uso flexível)
    isolated: "/images/design-mode/Logoisolado.svg",

    // Raiz pública (legacy, prefer /images/)
    rootLight: "/logo-light.jpg",
    rootDark: "/logo-dark.jpg",
  },

  icons: {
    // Ícone do app (SVG com suporte a light/dark via CSS media query)
    app: "/icon.svg",

    // Variantes explícitas
    light: "/images/icon-light.svg",
    dark: "/images/icon-dark.svg",
  },

  placeholders: {
    logo: "/placeholder-logo.svg",
    logoPng: "/placeholder-logo.png",
    image: "/placeholder.svg",
    imagePng: "/placeholder.jpg",
    user: "/placeholder-user.jpg",
  },

  marketing: {
    leadsSearch: "/business-leads-generation-interface-with-search-fi.jpg",
    kanbanDashboard: "/modern-dashboard-interface-with-leads-kanban-board.jpg",
    processSteps: "/step-by-step-process-diagram-for-lead-generation-w.jpg",
  },
} as const

// Helper: retorna o logo certo baseado no tema
export function getLogo(theme: "light" | "dark", format: "svg" | "jpg" = "svg") {
  if (format === "jpg") {
    return theme === "dark" ? assets.logos.darkJpg : assets.logos.lightJpg
  }
  return theme === "dark" ? assets.logos.darkSvg : assets.logos.lightSvg
}

// Helper: retorna o ícone certo baseado no tema
export function getIcon(theme: "light" | "dark") {
  return theme === "dark" ? assets.icons.dark : assets.icons.light
}
