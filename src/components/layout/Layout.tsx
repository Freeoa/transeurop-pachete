import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { SidebarProvider, useSidebar } from './SidebarContext';
import { ToastContainer } from '../ui/Toast';
import { useIsMobile } from '../../hooks/useIsMobile';
import { FAB } from '../ui/FAB';

/** Map route paths to display titles */
const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/comenzi': 'Comenzi',
  '/tracking': 'Tracking',
  '/programari': 'Programări',
  '/soferi': 'Șoferi',
  '/sofer': 'Azi',
  '/flota': 'Flotă',
  '/clienti': 'Clienți',
  '/incasari': 'Încasări',
  '/rapoarte': 'Rapoarte',
  '/cheltuieli': 'Cheltuieli',
  '/setari': 'Setări',
  '/simulador': 'Tahograf',
  '/harta': 'Hartă rute',
  '/client': 'Comenzile mele',
};

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname];
  const base = '/' + pathname.split('/')[1];
  return routeTitles[base] || 'TransEurop';
}

function LayoutInner() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const { isDesktop } = useIsMobile();
  const title = getPageTitle(location.pathname);

  const marginLeft = isDesktop ? (collapsed ? 56 : 220) : 0;

  return (
    <div className="flex h-screen bg-bg-secondary overflow-hidden">
      <Sidebar />

      <div
        className="flex flex-col flex-1 min-w-0 transition-[margin-left] duration-200 ease-in-out"
        style={{ marginLeft }}
      >
        <Topbar title={title} />

        <main
          className="flex-1 overflow-y-auto overscroll-y-contain"
          style={{
            WebkitOverflowScrolling: 'touch',
            paddingBottom: isDesktop ? 0 : 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {location.pathname === '/simulador' ? (
            <Outlet />
          ) : (
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5">
              <Outlet />
            </div>
          )}
        </main>
      </div>

      <FAB />
    </div>
  );
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutInner />
      <ToastContainer />
    </SidebarProvider>
  );
}
