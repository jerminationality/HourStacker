"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

type ThemeName = "light" | "dark"

interface ThemeProviderProps {
  children: ReactNode
  attribute?: string
  defaultTheme?: ThemeName | "system"
  disableTransitionOnChange?: boolean
  enableSystem?: boolean
  storageKey?: string
}

interface ThemeContextValue {
  theme: ThemeName
  resolvedTheme: ThemeName
  systemTheme: ThemeName
  setTheme: (theme: ThemeName) => void
}

const THEME_STORAGE_KEY = "hourstacker:theme"
const MEDIA_QUERY = "(prefers-color-scheme: dark)"

const ThemeContext = createContext<ThemeContextValue | null>(null)

const normalizeTheme = (value: ThemeName | "system" | undefined, fallback: ThemeName): ThemeName => {
  if (value === "dark" || value === "light") {
    return value
  }
  return fallback
}

const readStoredTheme = (storageKey: string): ThemeName | null => {
  if (typeof window === "undefined") {
    return null
  }
  const stored = window.localStorage.getItem(storageKey)
  return stored === "dark" || stored === "light" ? stored : null
}

const prefersDark = (): ThemeName => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light"
  }
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
}

const applyAttribute = (attribute: string, theme: ThemeName) => {
  if (typeof document === "undefined") {
    return
  }
  const root = document.documentElement
  if (attribute === "class") {
    root.classList.toggle("dark", theme === "dark")
  } else if (attribute) {
    root.setAttribute(attribute, theme)
  }
  root.dataset["theme"] = theme
}

const disableTransitionsTemporarily = () => {
  if (typeof document === "undefined") {
    return () => {}
  }
  const style = document.createElement("style")
  style.appendChild(document.createTextNode("*{transition:none !important;}"))
  document.head.append(style)
  return () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove()
      })
    })
  }
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "light",
  disableTransitionOnChange = false,
  enableSystem = true,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const initialTheme = normalizeTheme(
    typeof defaultTheme === "string" ? (defaultTheme as ThemeName) : "light",
    "light",
  )

  const [theme, setThemeState] = useState<ThemeName>(initialTheme)
  const [systemTheme, setSystemTheme] = useState<ThemeName>(() => (enableSystem ? prefersDark() : initialTheme))
  const isMounted = useRef(false)

  const syncTheme = useCallback(
    (next: ThemeName, persist = true) => {
      setThemeState(next)
      if (persist && typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, next)
      }
      const cleanup = disableTransitionOnChange ? disableTransitionsTemporarily() : () => {}
      applyAttribute(attribute, next)
      cleanup()
    },
    [attribute, disableTransitionOnChange, storageKey],
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    const storedTheme = readStoredTheme(storageKey)
    const shouldUseSystem = enableSystem || defaultTheme === "system"
    const preferred = shouldUseSystem ? prefersDark() : initialTheme
    const nextTheme = storedTheme ?? preferred
    syncTheme(nextTheme, Boolean(storedTheme))
    setSystemTheme(prefersDark())
    isMounted.current = true

    if (shouldUseSystem) {
      const media = window.matchMedia(MEDIA_QUERY)
      const listener = (event: MediaQueryListEvent) => {
        const next = event.matches ? "dark" : "light"
        setSystemTheme(next)
        if (!readStoredTheme(storageKey)) {
          syncTheme(next, false)
        }
      }
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    }
  }, [defaultTheme, enableSystem, initialTheme, storageKey, syncTheme])

  const setTheme = useCallback(
    (next: ThemeName) => {
      if (!isMounted.current) {
        setThemeState(next)
        return
      }
      syncTheme(next)
    },
    [syncTheme],
  )

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme,
      systemTheme,
      setTheme,
    }),
    [setTheme, systemTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
