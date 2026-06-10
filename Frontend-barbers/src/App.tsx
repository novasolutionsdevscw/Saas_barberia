import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MatrizProtectedRoute } from './components/MatrizProtectedRoute';
import { OperationalProtectedRoute } from './components/OperationalProtectedRoute';
import { SubscriptionGuard } from './components/SubscriptionGuard';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { MatrizLayout } from './layouts/MatrizLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { ConfiguracionPage } from './pages/ConfiguracionPage';
import { GaleriaPage } from './pages/GaleriaPage';
import { BarberosPage } from './pages/BarberosPage';
import { ServiciosPage } from './pages/ServiciosPage';
import { ProductosPage } from './pages/ProductosPage';
import { TurnosPage } from './pages/TurnosPage';
import { ClientesPage } from './pages/ClientesPage';
import { InventarioPage } from './pages/InventarioPage';
import { ReportesPage } from './pages/ReportesPage';
import { BarberiaPublicPage } from './pages/BarberiaPublicPage';
import { BarberiaLandingPage } from './pages/BarberiaLandingPage';
import { MatrizDashboardPage } from './pages/matriz/MatrizDashboardPage';
import { MatrizBarberiasPage } from './pages/matriz/MatrizBarberiasPage';
import { MatrizPagosPage } from './pages/matriz/MatrizPagosPage';
import { MatrizEstadosPage } from './pages/matriz/MatrizEstadosPage';
import { MatrizReportesPage } from './pages/matriz/MatrizReportesPage';
import { CitaPublicPage } from './pages/CitaPublicPage';
import { BarberoMisCitasPage } from './pages/barbero/BarberoMisCitasPage';
import { BarberoPerfilPage } from './pages/barbero/BarberoPerfilPage';
import { ValidarQrPage } from './pages/barbero/ValidarQrPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/b/:slug" element={<BarberiaLandingPage />} />
        <Route path="/cita/:uuid" element={<CitaPublicPage />} />
        <Route path="/barberia/:id" element={<BarberiaPublicPage />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<MatrizProtectedRoute />}>
          <Route path="/matriz" element={<MatrizLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MatrizDashboardPage />} />
            <Route path="barberias" element={<MatrizBarberiasPage />} />
            <Route path="empresas" element={<Navigate to="/matriz/barberias" replace />} />
            <Route path="pagos" element={<MatrizPagosPage />} />
            <Route path="estados" element={<MatrizEstadosPage />} />
            <Route path="reportes" element={<MatrizReportesPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<OperationalProtectedRoute />}>
            <Route element={<SubscriptionGuard />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHomePage />} />
                <Route path="barberos" element={<BarberosPage />} />
                <Route path="servicios" element={<ServiciosPage />} />
                <Route path="productos" element={<ProductosPage />} />
                <Route path="clientes" element={<ClientesPage />} />
                <Route path="turnos" element={<TurnosPage />} />
                <Route path="inventario" element={<InventarioPage />} />
                <Route path="reportes" element={<ReportesPage />} />
                <Route path="galeria" element={<GaleriaPage />} />
                <Route path="configuracion" element={<ConfiguracionPage />} />
                <Route path="mis-citas" element={<BarberoMisCitasPage />} />
                <Route path="mi-perfil" element={<BarberoPerfilPage />} />
                <Route path="validar-qr" element={<ValidarQrPage />} />
                <Route path="validar-cita/:uuid" element={<ValidarQrPage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
