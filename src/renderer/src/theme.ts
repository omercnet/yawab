import { CSS_VAR_BY_TOKEN, resolveTheme, type Theme } from '@shared/themes'

/** Resolve a stored preference (incl. 'system') to a concrete theme for preview. */
export function resolveThemePreview(preference: string, dark: boolean): Theme {
  return resolveTheme(preference, dark)
}

/** True when the OS currently prefers a dark color scheme. */
export function prefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true
}

/** Apply a resolved theme's design tokens to the document root. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  for (const [token, cssVar] of Object.entries(CSS_VAR_BY_TOKEN)) {
    root.style.setProperty(cssVar, theme.tokens[token as keyof Theme['tokens']])
  }
  root.dataset.theme = theme.id
  root.style.colorScheme = theme.isDark ? 'dark' : 'light'
}

/** Resolve a stored preference (incl. 'system') against the OS scheme and apply it. */
export function applyThemePreference(preference: string): Theme {
  const theme = resolveTheme(preference, prefersDark())
  applyTheme(theme)
  return theme
}

/** Toggle the reduce-motion flag CSS uses to disable non-essential animation. */
export function applyReduceMotion(enabled: boolean): void {
  document.documentElement.dataset.reduceMotion = enabled ? 'true' : 'false'
}
