import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import RegistrarEmpleado from "./pages/RegistrarEmpleado";
import GestionNomina from "./pages/GestionNomina";
import Volantes from "./pages/Volantes";
import VolanteDetalle from "./pages/VolanteDetalle";
import Historial from "./pages/Historial";
import ExportarTxt from "./pages/ExportarTxt";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/panel" replace />} />
        <Route path="panel" element={<Dashboard />} />
        <Route path="registrar" element={<RegistrarEmpleado />} />
        <Route path="nomina" element={<GestionNomina />} />
        <Route path="empleados" element={<Navigate to="/nomina" replace />} />
        <Route path="volantes" element={<Volantes />} />
        <Route path="volantes/:id" element={<VolanteDetalle />} />
        <Route path="historial" element={<Historial />} />
        <Route path="exportar" element={<ExportarTxt />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
