# Lidzy Design System

Centraliza todos os tokens de design, assets e referências visuais do projeto Lidzy.

---

## Estrutura

```
design-system/
├── index.ts              # Exportações centralizadas
├── tokens/
│   ├── index.ts          # Barrel export dos tokens
│   ├── colors.ts         # Paleta de cores (oklch)
│   ├── typography.ts     # Fontes e escala tipográfica
│   └── spacing.ts        # Espaçamento e border radius
└── assets/
    └── index.ts          # Caminhos dos logos, ícones e imagens
```

---

## Cores

O projeto usa o espaço de cor **OKLch** (perceptualmente uniforme), garantindo transições suaves e acessibilidade consistente entre temas.

### Cor da Marca
| Token | Valor | Uso |
|-------|-------|-----|
| `brand.primary` | `oklch(0.55 0.15 150)` | Verde Lidzy principal (light mode) |
| `brand.primaryLight` | `oklch(0.6 0.15 150)` | Verde Lidzy suavizado (dark mode) |
| `brand.accent` | `oklch(0.95 0.05 150)` | Verde claro de destaque |

### CSS Variables (globals.css)
```css
--primary: oklch(0.55 0.15 150);   /* Verde Lidzy */
--accent:  oklch(0.95 0.05 150);   /* Verde claro */
```

---

## Tipografia

### Fonte Principal: **Sora**
- Fonte: [Sora (Google Fonts)](https://fonts.google.com/specimen/Sora)
- CSS Variable: `--font-sora` → aplicada como `--font-sans`
- Carregada em: `app/layout.tsx` via `next/font/google`
- Subsets: `latin`
- Display: `swap`

```tsx
import { Sora } from "next/font/google"

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
})
```

---

## Logos e Ícones

Todos os assets ficam em `/public/` e `/public/images/`.

### Logos

| Arquivo | Formato | Tema | Uso |
|---------|---------|------|-----|
| `/images/logo-light.svg` | SVG | Light | Principal (preferido) |
| `/images/logo-dark.svg` | SVG | Dark | Principal (preferido) |
| `/images/logo-light.jpg` | JPG | Light | Fallback |
| `/images/logo-dark.jpg` | JPG | Dark | Fallback |
| `/images/logo-square-light.svg` | SVG | Light | Avatar / Favicon |
| `/images/logo-square-dark.svg` | SVG | Dark | Avatar / Favicon |
| `/images/design-mode/Logoisolado.svg` | SVG | — | Logo sem fundo |

### Ícones

| Arquivo | Descrição |
|---------|-----------|
| `/icon.svg` | Ícone do app (suporte automático light/dark via media query) |
| `/images/icon-light.svg` | Ícone explícito light |
| `/images/icon-dark.svg` | Ícone explícito dark |

---

## Border Radius

| Token | Valor CSS | Pixels |
|-------|-----------|--------|
| `radius.sm` | `calc(0.5rem - 4px)` | 4px |
| `radius.md` | `calc(0.5rem - 2px)` | 6px |
| `radius.lg` | `0.5rem` | 8px |
| `radius.xl` | `calc(0.5rem + 4px)` | 12px |

---

## Componentes UI

Baseado em **shadcn/ui** (estilo `new-york`) + **Radix UI**.
Localização: `components/ui/`
Configuração: `components.json`
Ícones: **Lucide React**

---

## Como Usar

```ts
import { colors, typography, spacing, assets, getLogo } from "@/design-system"

// Cor primária
const primary = colors.brand.primary // oklch(0.55 0.15 150)

// Logo correto pelo tema
const logoSrc = getLogo("dark") // /images/logo-dark.svg

// Caminho de ícone
const icon = assets.icons.app // /icon.svg
```

---

## Stack Técnica

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Next.js | 15.5.4 | Framework |
| React | 19.1.0 | UI |
| Tailwind CSS | 4.1.9 | Estilização |
| shadcn/ui | — | Componentes base |
| next-themes | — | Troca de tema |
| Lucide React | 0.454.0 | Ícones |
| Recharts | — | Gráficos |
