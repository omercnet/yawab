/**
 * Color themes.
 *
 * Each theme provides values for the app's design tokens (the CSS custom
 * properties declared in `styles.css :root`). Applying a theme just overrides
 * those variables on the document root, so every component that uses
 * `var(--token)` re-themes automatically. This module is pure data + lookups
 * (no DOM access) so it typechecks in both the node and web build targets.
 */

export interface ThemeTokens {
  bg: string
  surface: string
  surface2: string
  border: string
  text: string
  muted: string
  accent: string
  accentDark: string
  danger: string
  warn: string
  /** Readable text/icon color on top of an `accent` background. */
  accentText: string
}

export interface Theme {
  id: string
  name: string
  isDark: boolean
  tokens: ThemeTokens
}

/** Maps {@link ThemeTokens} keys to their CSS custom-property names. */
export const CSS_VAR_BY_TOKEN: Record<keyof ThemeTokens, string> = {
  bg: '--bg',
  surface: '--surface',
  surface2: '--surface-2',
  border: '--border',
  text: '--text',
  muted: '--muted',
  accent: '--accent',
  accentDark: '--accent-dark',
  danger: '--danger',
  warn: '--warn',
  accentText: '--accent-text'
}

export const DEFAULT_DARK_THEME_ID = 'yawab-dark'
export const DEFAULT_LIGHT_THEME_ID = 'yawab-light'

export const THEMES: readonly Theme[] = [
  {
    id: 'yawab-dark',
    name: 'Yawab Dark',
    isDark: true,
    tokens: {
      bg: '#0f1115',
      surface: '#181b22',
      surface2: '#20242d',
      border: '#2c313c',
      text: '#e6e9ef',
      muted: '#8b93a3',
      accent: '#25d366',
      accentDark: '#1da851',
      danger: '#ef4444',
      warn: '#f59e0b',
      accentText: '#04210f'
    }
  },
  {
    id: 'yawab-light',
    name: 'Yawab Light',
    isDark: false,
    tokens: {
      bg: '#f7f8fa',
      surface: '#ffffff',
      surface2: '#eef1f5',
      border: '#d7dce4',
      text: '#11161d',
      muted: '#5b6675',
      accent: '#1da851',
      accentDark: '#178a43',
      danger: '#dc2626',
      warn: '#d97706',
      accentText: '#ffffff'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    tokens: {
      bg: '#282a36',
      surface: '#21222c',
      surface2: '#343746',
      border: '#44475a',
      text: '#f8f8f2',
      muted: '#6272a4',
      accent: '#bd93f9',
      accentDark: '#9d6ff0',
      danger: '#ff5555',
      warn: '#ffb86c',
      accentText: '#282a36'
    }
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    isDark: true,
    tokens: {
      bg: '#1a1b26',
      surface: '#16161e',
      surface2: '#24283b',
      border: '#2f3549',
      text: '#c0caf5',
      muted: '#565f89',
      accent: '#7aa2f7',
      accentDark: '#5d83e8',
      danger: '#f7768e',
      warn: '#e0af68',
      accentText: '#1a1b26'
    }
  },
  {
    id: 'tokyo-night-moon',
    name: 'Tokyo Night Moon',
    isDark: true,
    tokens: {
      bg: '#222436',
      surface: '#1e2030',
      surface2: '#2f334d',
      border: '#383b54',
      text: '#c8d3f5',
      muted: '#7a88cf',
      accent: '#82aaff',
      accentDark: '#6591f0',
      danger: '#ff757f',
      warn: '#ffc777',
      accentText: '#222436'
    }
  },
  {
    id: 'monokai-pro',
    name: 'Monokai Pro',
    isDark: true,
    tokens: {
      bg: '#2d2a2e',
      surface: '#221f22',
      surface2: '#353236',
      border: '#403e41',
      text: '#fcfcfa',
      muted: '#939293',
      accent: '#ffd866',
      accentDark: '#f0c64a',
      danger: '#ff6188',
      warn: '#fc9867',
      accentText: '#2d2a2e'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    isDark: true,
    tokens: {
      bg: '#2e3440',
      surface: '#272b35',
      surface2: '#3b4252',
      border: '#434c5e',
      text: '#eceff4',
      muted: '#7b88a1',
      accent: '#88c0d0',
      accentDark: '#6aa6b8',
      danger: '#bf616a',
      warn: '#ebcb8b',
      accentText: '#2e3440'
    }
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    isDark: true,
    tokens: {
      bg: '#282828',
      surface: '#1d2021',
      surface2: '#3c3836',
      border: '#504945',
      text: '#ebdbb2',
      muted: '#928374',
      accent: '#b8bb26',
      accentDark: '#98971a',
      danger: '#fb4934',
      warn: '#fabd2f',
      accentText: '#282828'
    }
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    isDark: false,
    tokens: {
      bg: '#fbf1c7',
      surface: '#ffffff',
      surface2: '#ebdbb2',
      border: '#d5c4a1',
      text: '#3c3836',
      muted: '#7c6f64',
      accent: '#79740e',
      accentDark: '#5f5b0a',
      danger: '#9d0006',
      warn: '#b57614',
      accentText: '#ffffff'
    }
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    isDark: true,
    tokens: {
      bg: '#002b36',
      surface: '#00252e',
      surface2: '#073642',
      border: '#0e4b59',
      text: '#93a1a1',
      muted: '#586e75',
      accent: '#268bd2',
      accentDark: '#1f6fa8',
      danger: '#dc322f',
      warn: '#b58900',
      accentText: '#002b36'
    }
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    isDark: false,
    tokens: {
      bg: '#fdf6e3',
      surface: '#fffbf0',
      surface2: '#eee8d5',
      border: '#ddd6c1',
      text: '#586e75',
      muted: '#93a1a1',
      accent: '#268bd2',
      accentDark: '#1f6fa8',
      danger: '#dc322f',
      warn: '#b58900',
      accentText: '#fdf6e3'
    }
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    isDark: true,
    tokens: {
      bg: '#1e1e2e',
      surface: '#181825',
      surface2: '#313244',
      border: '#45475a',
      text: '#cdd6f4',
      muted: '#7f849c',
      accent: '#cba6f7',
      accentDark: '#b088ef',
      danger: '#f38ba8',
      warn: '#fab387',
      accentText: '#1e1e2e'
    }
  },
  {
    id: 'catppuccin-latte',
    name: 'Catppuccin Latte',
    isDark: false,
    tokens: {
      bg: '#eff1f5',
      surface: '#ffffff',
      surface2: '#e6e9ef',
      border: '#ccd0da',
      text: '#4c4f69',
      muted: '#8c8fa1',
      accent: '#8839ef',
      accentDark: '#7028d8',
      danger: '#d20f39',
      warn: '#df8e1d',
      accentText: '#ffffff'
    }
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    isDark: true,
    tokens: {
      bg: '#282c34',
      surface: '#21252b',
      surface2: '#2c313a',
      border: '#3b4048',
      text: '#abb2bf',
      muted: '#5c6370',
      accent: '#61afef',
      accentDark: '#4d97e0',
      danger: '#e06c75',
      warn: '#e5c07b',
      accentText: '#282c34'
    }
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    isDark: true,
    tokens: {
      bg: '#011627',
      surface: '#001121',
      surface2: '#0b2942',
      border: '#1d3b53',
      text: '#d6deeb',
      muted: '#637777',
      accent: '#82aaff',
      accentDark: '#5d8ef0',
      danger: '#ef5350',
      warn: '#ecc48d',
      accentText: '#011627'
    }
  },
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    isDark: true,
    tokens: {
      bg: '#191724',
      surface: '#1f1d2e',
      surface2: '#26233a',
      border: '#403d52',
      text: '#e0def4',
      muted: '#6e6a86',
      accent: '#ebbcba',
      accentDark: '#d7a6a4',
      danger: '#eb6f92',
      warn: '#f6c177',
      accentText: '#191724'
    }
  },
  {
    id: 'ayu-dark',
    name: 'Ayu Dark',
    isDark: true,
    tokens: {
      bg: '#0b0e14',
      surface: '#0d1017',
      surface2: '#131721',
      border: '#1d212c',
      text: '#bfbdb6',
      muted: '#565b66',
      accent: '#e6b450',
      accentDark: '#d19f3a',
      danger: '#f07178',
      warn: '#ffb454',
      accentText: '#0b0e14'
    }
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    isDark: true,
    tokens: {
      bg: '#0d1117',
      surface: '#161b22',
      surface2: '#21262d',
      border: '#30363d',
      text: '#c9d1d9',
      muted: '#8b949e',
      accent: '#58a6ff',
      accentDark: '#3f8ef0',
      danger: '#f85149',
      warn: '#d29922',
      accentText: '#0d1117'
    }
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    isDark: false,
    tokens: {
      bg: '#ffffff',
      surface: '#f6f8fa',
      surface2: '#eaeef2',
      border: '#d0d7de',
      text: '#1f2328',
      muted: '#656d76',
      accent: '#0969da',
      accentDark: '#0757b8',
      danger: '#cf222e',
      warn: '#9a6700',
      accentText: '#ffffff'
    }
  },
  {
    id: 'synthwave-84',
    name: "Synthwave '84",
    isDark: true,
    tokens: {
      bg: '#262335',
      surface: '#241b2f',
      surface2: '#34294f',
      border: '#463465',
      text: '#f4eee4',
      muted: '#848bbd',
      accent: '#ff7edb',
      accentDark: '#e85ec9',
      danger: '#fe4450',
      warn: '#fede5d',
      accentText: '#241b2f'
    }
  }
]

const THEMES_BY_ID = new Map<string, Theme>(THEMES.map((theme) => [theme.id, theme]))

export function getTheme(id: string): Theme | undefined {
  return THEMES_BY_ID.get(id)
}

/**
 * Resolve a stored theme preference to a concrete theme. `'system'` follows the
 * OS color scheme; an unknown id falls back to the default dark theme.
 */
export function resolveTheme(preference: string, prefersDark = true): Theme {
  if (preference === 'system') {
    return THEMES_BY_ID.get(
      prefersDark ? DEFAULT_DARK_THEME_ID : DEFAULT_LIGHT_THEME_ID
    ) as Theme
  }
  return (
    THEMES_BY_ID.get(preference) ?? (THEMES_BY_ID.get(DEFAULT_DARK_THEME_ID) as Theme)
  )
}
