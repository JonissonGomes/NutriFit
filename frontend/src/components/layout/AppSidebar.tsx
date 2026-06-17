import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface SidebarNavItem {
  path: string
  label: string
  icon: ReactNode
}

interface AppSidebarProps {
  items: SidebarNavItem[]
  footer?: ReactNode
  isMobileOpen: boolean
  onMobileClose: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
  isItemActive: (path: string) => boolean
  iconSet?: 'mui' | 'lucide'
}

const AppSidebar = ({
  items,
  footer,
  isMobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapsed,
  isItemActive,
  iconSet = 'mui',
}: AppSidebarProps) => {
  const showLabels = !collapsed || isMobileOpen
  const isDesktopCollapsed = collapsed && !isMobileOpen
  const CollapseIcon = iconSet === 'lucide'
    ? (collapsed ? ChevronRight : ChevronLeft)
    : null

  return (
    <aside
      className={`fixed top-14 left-0 bottom-0 z-30 flex flex-col bg-primary-600 text-white border-r border-primary-700 shadow-lg transform transition-all duration-200 ease-in-out w-64 ${
        collapsed ? 'lg:w-[4.5rem]' : ''
      } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 md:p-3 space-y-1 scrollbar-thin">
        {items.map((item) => {
          const active = isItemActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onMobileClose}
              title={!showLabels ? item.label : undefined}
              className={`flex items-center rounded-lg transition-all text-sm ${
                isDesktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } ${
                active
                  ? 'bg-white text-primary-700 font-semibold shadow-md'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className={`shrink-0 flex items-center justify-center ${active ? 'text-primary-600' : ''}`}>
                {item.icon}
              </span>
              {showLabels ? (
                <span className="truncate whitespace-nowrap">{item.label}</span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      {footer ? (
        <div className={`shrink-0 border-t border-primary-500/50 p-2 md:p-3 ${collapsed && !isMobileOpen ? 'space-y-1' : ''}`}>
          {footer}
        </div>
      ) : null}

      <div className="hidden lg:block shrink-0 border-t border-primary-500/50 p-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
          className={`w-full flex items-center rounded-lg text-white/90 hover:bg-white/10 hover:text-white transition-colors text-sm ${
            isDesktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
          }`}
        >
          {iconSet === 'lucide' && CollapseIcon ? (
            <CollapseIcon className="h-5 w-5 shrink-0" />
          ) : collapsed ? (
            <ChevronRightIcon sx={{ fontSize: 20 }} />
          ) : (
            <ChevronLeftIcon sx={{ fontSize: 20 }} />
          )}
          {!isDesktopCollapsed ? <span className="truncate">Recolher menu</span> : null}
        </button>
      </div>
    </aside>
  )
}

export default AppSidebar
