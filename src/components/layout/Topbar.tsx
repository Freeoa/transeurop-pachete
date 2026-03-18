import { Search, Bell, Menu, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from './SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getRoleHome } from './RoleGuard';
import { GlobalSearch } from './GlobalSearch';
import { mockAlerts } from '../../data';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { UserRole } from '../../types';

interface TopbarProps {
  title: string;
  breadcrumb?: { label: string; to?: string }[];
}

const roleConfig: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin: { label: 'Manager', color: 'text-accent', bg: 'bg-accent/10' },
  dispecer: { label: 'Dispecer', color: 'text-info', bg: 'bg-info/10' },
  sofer: { label: 'Șofer', color: 'text-warning', bg: 'bg-warning/10' },
  client: { label: 'Client', color: 'text-success', bg: 'bg-success/10' },
};

export default function Topbar({ title, breadcrumb }: TopbarProps) {
  const { setMobileOpen, mobileOpen } = useSidebar();
  const { user, role, switchRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const unresolvedAlerts = mockAlerts.filter(a => !a.rezolvat);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  // Ctrl+K / Cmd+K to open global search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  return (
    <header className="relative h-[48px] sm:h-[52px] bg-bg-primary border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Mobile hamburger */}
      <button
        className="md:hidden text-text-secondary hover:text-text-primary transition-colors -ml-1"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      {/* Left: breadcrumb / title */}
      <div className="flex items-center gap-1.5 text-[13px] min-w-0 shrink-0">
        {breadcrumb && breadcrumb.length > 0 ? (
          breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-text-tertiary" />}
              <span
                className={
                  i === breadcrumb.length - 1
                    ? 'text-text-primary font-medium truncate'
                    : 'text-text-tertiary truncate'
                }
              >
                {crumb.label}
              </span>
            </span>
          ))
        ) : (
          <span className="text-text-primary font-medium truncate">{title}</span>
        )}
      </div>

      {/* Center: search */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full max-w-md hidden sm:flex items-center gap-2 h-8 pl-3 pr-2 rounded-lg bg-bg-secondary border border-border text-[13px] text-text-tertiary hover:border-border-strong transition-colors cursor-pointer"
        >
          <Search className="size-4 text-text-tertiary" />
          <span className="text-text-tertiary">Caută...</span>
          <kbd className="hidden sm:inline-flex ml-auto text-[10px] text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded-[4px] border border-border">Ctrl+K</kbd>
        </button>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Mobile search button */}
        <button
          className="sm:hidden text-text-secondary hover:text-text-primary p-1.5 rounded-md hover:bg-bg-secondary transition-colors"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={18} strokeWidth={1.75} />
        </button>

        {/* Role switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-bg-secondary rounded-[6px] p-0.5 border border-border">
          {(['admin', 'sofer', 'client'] as UserRole[]).map((r) => {
            const cfg = roleConfig[r];
            const active = role === r;
            return (
              <button
                key={r}
                onClick={() => { switchRole(r); navigate(getRoleHome(r)); }}
                className={[
                  'px-2 py-1 rounded-[4px] text-[11px] font-medium transition-all',
                  active ? `${cfg.bg} ${cfg.color}` : 'text-text-tertiary hover:text-text-secondary',
                ].join(' ')}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative text-text-secondary hover:text-text-primary p-1.5 rounded-md hover:bg-bg-secondary transition-colors"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <Bell size={18} strokeWidth={1.75} />
            {unresolvedAlerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[9px] font-semibold text-white animate-pulse-badge">
                {unresolvedAlerts.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-2rem)] bg-bg-primary border border-border rounded-lg shadow-lg z-50 max-h-[360px] overflow-y-auto animate-[fade-in-up_150ms_ease-out]">
                <div className="px-3 py-2.5 border-b border-border text-[13px] font-semibold text-text-primary">
                  Notificări
                </div>
                {unresolvedAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-bg-secondary transition-colors">
                    <p className="text-[13px] text-text-primary leading-snug">{alert.mesaj}</p>
                    <p className="text-[11px] text-text-tertiary mt-1">
                      {formatDistanceToNow(parseISO(alert.timestamp), { addSuffix: true, locale: ro })}
                    </p>
                  </div>
                ))}
                {unresolvedAlerts.length === 0 && (
                  <div className="px-3 py-6 text-center text-[13px] text-text-tertiary">
                    Nicio notificare
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pr-2 rounded-md hover:bg-bg-secondary transition-colors"
          >
            <div className={`w-7 h-7 rounded-full ${roleConfig[role].bg} flex items-center justify-center ${roleConfig[role].color} text-xs font-semibold`}>
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <span className="hidden sm:block text-[13px] font-medium text-text-primary">
              {user.name.split(' ')[0]}
            </span>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-bg-primary border border-border rounded-lg shadow-lg py-1 z-50 animate-[fade-in-up_150ms_ease-out]">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-[13px] font-medium text-text-primary">{user.name}</div>
                <div className="text-[11px] text-text-tertiary">{user.email}</div>
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${roleConfig[role].bg} ${roleConfig[role].color}`}>
                  {roleConfig[role].label}
                </span>
              </div>
              {/* Mobile role switcher */}
              <div className="sm:hidden px-3 py-2 border-b border-border">
                <div className="text-[11px] text-text-tertiary mb-1.5">Schimbă rol:</div>
                <div className="flex gap-1">
                  {(['admin', 'sofer', 'client'] as UserRole[]).map((r) => {
                    const cfg = roleConfig[r];
                    const active = role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => { switchRole(r); navigate(getRoleHome(r)); setUserMenuOpen(false); }}
                        className={[
                          'flex-1 px-2 py-1.5 rounded-[4px] text-[11px] font-medium transition-all',
                          active ? `${cfg.bg} ${cfg.color}` : 'bg-bg-secondary text-text-tertiary',
                        ].join(' ')}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                className="w-full text-left px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-secondary transition-colors"
                onClick={() => { navigate('/setari'); setUserMenuOpen(false); }}
              >
                Profil
              </button>
              <button
                className="w-full text-left px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-secondary transition-colors"
                onClick={() => { navigate('/setari'); setUserMenuOpen(false); }}
              >
                Preferințe
              </button>
              <div className="border-t border-border mt-1 pt-1">
                <button
                  className="w-full text-left px-3 py-2 text-[13px] text-danger hover:bg-bg-secondary transition-colors"
                  onClick={() => { switchRole('client'); navigate('/'); toast('Ai fost deconectat', 'info'); setUserMenuOpen(false); }}
                >
                  Deconectare
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
