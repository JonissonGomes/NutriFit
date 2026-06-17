import { useCallback, useState } from 'react'

const STORAGE_KEY = 'nufit-sidebar-collapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return { collapsed, toggleCollapsed, setCollapsed }
}

/** Destaca o item correto em rotas filhas (ex.: /meal-plans/123). */
export function isNavItemActive(pathname: string, itemPath: string): boolean {
  if (itemPath.endsWith('/dashboard')) {
    return pathname === itemPath
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export const SIDEBAR_WIDTH_EXPANDED = '16rem'
export const SIDEBAR_WIDTH_COLLAPSED = '4.5rem'
