import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

function obtenerModulo(ruta) {
  if (ruta.startsWith("/registrar")) return "Registrar empleado";
  if (ruta.startsWith("/nomina") || ruta.startsWith("/empleados")) return "Gestión de nómina";
  if (ruta.startsWith("/volantes")) return "Volantes de pago";
  if (ruta.startsWith("/historial")) return "Historial";
  if (ruta.startsWith("/exportar")) return "Nómina consolidada";
  if (ruta.startsWith("/panel")) return "Panel principal";
  return "Sistema";
}

export default function DashboardLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const location = useLocation();
  const modulo = obtenerModulo(location.pathname);

  useEffect(() => {
    setSidebarAbierto(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    function manejarTecla(evento) {
      if (evento.key === "Escape") setSidebarAbierto(false);
    }
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, []);

  return (
    <div className="min-h-screen">
      <a href="#contenido-principal" className="skip-link no-print">
        Ir al contenido principal
      </a>

      <Sidebar
        abierto={sidebarAbierto}
        onCerrar={() => setSidebarAbierto(false)}
      />

      <div className="app-content flex min-h-screen flex-col lg:pl-[280px]">
        <Header modulo={modulo} onAbrirMenu={() => setSidebarAbierto(true)} />
        <main
          id="contenido-principal"
          className="app-main mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          <Outlet />
        </main>
        <footer className="no-print mt-12 w-full border-t border-stone-200/60 px-4 py-4 text-xs text-stone-500 sm:px-6 lg:px-8">
          <div className="flex w-full flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="font-normal text-stone-400">
              © 2026 TransCaribeCol · Sistema de Gestión de Nómina
            </p>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-200/50 bg-stone-100/80 px-2.5 py-1 font-mono text-[11px] text-stone-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-emerald-200" />
              Persistencia: nomina.txt
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
