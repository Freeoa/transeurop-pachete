import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import { RoleGuard } from './components/layout/RoleGuard'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Drivers from './pages/Drivers'
import Fleet from './pages/Fleet'
import Clients from './pages/Clients'
import RoutesPage from './pages/RoutesPage'
import Finance from './pages/Finance'
import Expenses from './pages/Expenses'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import PublicTracking from './pages/PublicTracking'
import DriverToday from './pages/DriverToday'
import OrderCreate from './pages/OrderCreate'
import TachoSimulador from './pages/TachoSimulador'
import RoutesMap from './pages/RoutesMap'
import ClientDashboard from './pages/ClientDashboard'
import { useAuth } from './contexts/AuthContext'

function RoleHome() {
  const { role } = useAuth();
  if (role === 'sofer') return <Navigate to="/sofer" replace />;
  if (role === 'client') return <Navigate to="/client" replace />;
  return <Dashboard />;
}

const MANAGER = ['admin', 'dispecer'] as const;
const ALL = ['admin', 'dispecer', 'sofer', 'client'] as const;

export default function App() {
  return (
    <Routes>
      {/* Public tracking - no layout */}
      <Route path="/track" element={<PublicTracking />} />
      <Route path="/track/:awb" element={<PublicTracking />} />

      {/* Main app with sidebar layout */}
      <Route element={<Layout />}>
        <Route path="/" element={<RoleHome />} />
        <Route path="/comenzi" element={<Orders />} />
        <Route path="/comenzi/:id" element={<OrderDetail />} />
        <Route path="/comenzi/nou" element={<RoleGuard allowed={[...MANAGER]}><OrderCreate /></RoleGuard>} />
        <Route path="/tracking" element={<PublicTracking embedded />} />
        <Route path="/programari" element={<RoleGuard allowed={[...MANAGER]}><RoutesPage /></RoleGuard>} />
        <Route path="/soferi" element={<RoleGuard allowed={[...MANAGER]}><Drivers /></RoleGuard>} />
        <Route path="/flota" element={<RoleGuard allowed={[...MANAGER]}><Fleet /></RoleGuard>} />
        <Route path="/clienti" element={<RoleGuard allowed={[...MANAGER]}><Clients /></RoleGuard>} />
        <Route path="/incasari" element={<RoleGuard allowed={[...MANAGER]}><Finance /></RoleGuard>} />
        <Route path="/cheltuieli" element={<RoleGuard allowed={['admin', 'dispecer', 'sofer']}><Expenses /></RoleGuard>} />
        <Route path="/rapoarte" element={<RoleGuard allowed={[...MANAGER]}><Reports /></RoleGuard>} />
        <Route path="/setari" element={<RoleGuard allowed={[...ALL]}><Settings /></RoleGuard>} />
        <Route path="/sofer" element={<RoleGuard allowed={['sofer']}><DriverToday /></RoleGuard>} />
        <Route path="/client" element={<RoleGuard allowed={['client']}><ClientDashboard /></RoleGuard>} />
        <Route path="/simulador" element={<RoleGuard allowed={['admin', 'dispecer', 'sofer']}><TachoSimulador /></RoleGuard>} />
        <Route path="/harta" element={<RoleGuard allowed={['admin', 'dispecer']}><RoutesMap /></RoleGuard>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
