import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Package,
  Search,
  Calendar,
  Users,
  Truck,
  UserCheck,
  DollarSign,
  BarChart3,
  Receipt,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  CircleCheck,
  MapPin,
  User,
  Moon,
  Sun,
  Gauge,
} from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { MobileMenuSheet } from './MobileMenuSheet';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    section: 'OPERATIV',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
      { label: 'Comenzi', icon: Package, to: '/comenzi' },
      { label: 'Hartă rute', icon: MapPin, to: '/harta' },
      { label: 'Tracking', icon: Search, to: '/tracking' },
      { label: 'Programări', icon: Calendar, to: '/programari' },
    ],
  },
  {
    section: 'RESURSE',
    items: [
      { label: 'Șoferi', icon: Users, to: '/soferi' },
      { label: 'Flotă', icon: Truck, to: '/flota' },
      { label: 'Clienți', icon: UserCheck, to: '/clienti' },
    ],
  },
  {
    section: 'FINANCIAR',
    items: [
      { label: 'Încasări', icon: DollarSign, to: '/incasari' },
      { label: 'Rapoarte', icon: BarChart3, to: '/rapoarte' },
      { label: 'Cheltuieli', icon: Receipt, to: '/cheltuieli' },
    ],
  },
  {
    section: 'FORMARE',
    items: [
      { label: 'Tahograf', icon: Gauge, to: '/simulador' },
    ],
  },
  {
    section: 'SISTEM',
    items: [
      { label: 'Setări', icon: Settings, to: '/setari' },
    ],
  },
];

export default function Sidebar() {
  const { collapsed, toggleCollapsed } = useSidebar();
  const location = useLocation();
  const { isManager, isDriver, isClient } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const mobileNavItems = useMemo(() => {
    if (isDriver) {
      return [
        { label: 'Azi', icon: CircleCheck, to: '/sofer' },
        { label: 'Comenzi', icon: Package, to: '/comenzi' },
        { label: 'Tahograf', icon: Gauge, to: '/simulador' },
        { label: 'Cheltuieli', icon: Receipt, to: '/cheltuieli' },
        { label: 'Profil', icon: User, to: '/setari' },
      ];
    }
    if (isClient) {
      return [
        { label: 'Acasă', icon: Package, to: '/client' },
        { label: 'Comenzi', icon: Search, to: '/comenzi' },
        { label: 'Setări', icon: Settings, to: '/setari' },
      ];
    }
    // Manager (admin/dispecer)
    return [
      { label: 'Acasă', icon: LayoutDashboard, to: '/' },
      { label: 'Comenzi', icon: Package, to: '/comenzi' },
      { label: 'Șoferi', icon: Users, to: '/soferi' },
      { label: 'Financiar', icon: DollarSign, to: '/incasari' },
    ];
  }, [isManager, isDriver, isClient]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col bg-bg-sidebar h-screen fixed left-0 top-0 z-40 transition-[width] duration-200 ease-in-out shadow-[1px_0_0_rgba(0,0,0,0.1)]"
        style={{ width: collapsed ? 56 : 220 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 h-[52px] shrink-0 border-b border-white/[0.06]">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">TE</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-white font-semibold text-[13px] leading-tight whitespace-nowrap">
                TransEurop
              </div>
              <div className="text-text-tertiary text-[11px] leading-tight whitespace-nowrap">
                Transport Internațional
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navigation.map((group) => (
            <div key={group.section}>
              {!collapsed && (
                <div className="px-2 mb-1.5 text-[10px] font-medium tracking-wider text-text-tertiary select-none">
                  {group.section}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.to ||
                      location.pathname.startsWith(item.to + '/');

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`
                        group relative flex items-center gap-2.5 rounded-[6px]
                        text-[13px] font-medium transition-colors duration-100
                        ${collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'}
                        ${
                          isActive
                            ? 'bg-bg-sidebar-active text-white'
                            : 'text-text-tertiary hover:bg-bg-sidebar-hover hover:text-white/80'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-accent" />
                      )}
                      <item.icon size={16} strokeWidth={1.75} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}

                      {/* Collapsed tooltip */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-bg-sidebar-active text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                          {item.label}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className={`
            group relative flex items-center gap-2.5 rounded-[6px]
            text-[13px] font-medium transition-colors duration-100
            ${collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'}
            text-text-tertiary hover:bg-bg-sidebar-hover hover:text-white/80
            mx-2
          `}
        >
          {isDark ? (
            <Sun size={16} strokeWidth={1.75} className="shrink-0" />
          ) : (
            <Moon size={16} strokeWidth={1.75} className="shrink-0" />
          )}
          {!collapsed && <span className="truncate">Mod întunecat</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-bg-sidebar-active text-white text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg">
              Mod întunecat
            </div>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="flex items-center justify-center h-10 mx-2 mb-2 rounded-md text-text-tertiary hover:bg-bg-sidebar-hover hover:text-white/80 transition-colors"
        >
          {collapsed ? (
            <ChevronRight size={16} strokeWidth={1.75} />
          ) : (
            <ChevronLeft size={16} strokeWidth={1.75} />
          )}
        </button>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-sidebar border-t border-white/[0.06] flex items-center justify-around h-16 px-1 pb-[env(safe-area-inset-bottom)]">
        {mobileNavItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(item.to + '/');

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`
                flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-md
                ${isActive ? 'text-accent' : 'text-text-tertiary'}
              `}
            >
              <item.icon size={18} strokeWidth={1.75} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
        {/* Manager "Mai mult" button */}
        {isManager && (
          <button
            onClick={() => setMoreMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-md text-text-tertiary"
          >
            <Menu size={18} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">Mai mult</span>
          </button>
        )}
      </nav>

      {/* Mobile "Mai mult" sheet */}
      <MobileMenuSheet isOpen={moreMenuOpen} onClose={() => setMoreMenuOpen(false)} />

      {/* Mobile sidebar drawer (hamburger) */}
      <MobileSidebarDrawer />
    </>
  );
}

// ── Mobile Sidebar Drawer (opened by hamburger in Topbar) ──
function MobileSidebarDrawer() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const location = useLocation();

  if (!mobileOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fade-in_150ms_ease-out]"
        onClick={() => setMobileOpen(false)}
      />
      {/* Panel */}
      <aside className="absolute top-0 left-0 h-full w-[260px] bg-bg-sidebar flex flex-col animate-[slide-in-left_200ms_ease-out] shadow-xl">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 h-14 shrink-0 border-b border-white/[0.06]">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">TE</span>
          </div>
          <div className="overflow-hidden">
            <div className="text-white font-semibold text-[13px] leading-tight whitespace-nowrap">TransEurop</div>
            <div className="text-text-tertiary text-[11px] leading-tight whitespace-nowrap">Transport Internațional</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navigation.map((group) => (
            <div key={group.section}>
              <div className="px-2 mb-1.5 text-[10px] font-medium tracking-wider text-text-tertiary select-none">
                {group.section}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname === item.to ||
                      location.pathname.startsWith(item.to + '/');
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        'relative flex items-center gap-2.5 rounded-[6px] px-3 py-2.5',
                        'text-[13px] font-medium transition-colors duration-100',
                        isActive
                          ? 'bg-bg-sidebar-active text-white'
                          : 'text-text-tertiary hover:bg-bg-sidebar-hover hover:text-white/80',
                      ].join(' ')}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-accent" />
                      )}
                      <item.icon size={16} strokeWidth={1.75} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
