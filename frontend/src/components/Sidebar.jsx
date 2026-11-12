import { NavLink } from "react-router-dom";
import {
  Building2,
  Calculator,
  ChevronRight,
  FileDown,
  History,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";

const grupos = [
  {
    titulo: "Operación",
    enlaces: [
      { to: "/panel", etiqueta: "Panel principal", Icono: LayoutDashboard },
      { to: "/registrar", etiqueta: "Registrar empleado", Icono: UserPlus },
      { to: "/nomina", etiqueta: "Gestión de nómina", Icono: Calculator },
      { to: "/volantes", etiqueta: "Volantes de pago", Icono: ReceiptText },
    ],
  },
  {
    titulo: "Documentos",
    enlaces: [
      { to: "/historial", etiqueta: "Historial", Icono: History },
      { to: "/exportar", etiqueta: "Nómina consolidada", Icono: FileDown },
    ],
  },
];

export default function Sidebar({ abierto, onCerrar }) {
  return (
    <>
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          onClick={onCerrar}
          className="no-print fixed inset-0 z-40 bg-forest-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        id="navegacion-principal"
        aria-label="Navegación principal"
        className={`app-sidebar fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-hidden bg-forest-900 text-ink-100 shadow-lift transition-transform duration-300 ease-out lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Resplandor decorativo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl"
        />

        {/* Marca */}
        <div className="relative flex h-[84px] items-center justify-between border-b border-white/[0.07] px-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 font-display text-sm font-bold tracking-tight text-white shadow-glow ring-1 ring-white/20">
              TC
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-forest-900 bg-lime-400" />
            </div>
            <div>
              <p className="font-display text-[15px] font-semibold leading-5 tracking-tight text-white">
                TransCaribeCol
              </p>
              <p className="text-[11px] font-medium text-ink-300">
                Gestión de nómina
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 text-ink-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contexto de nómina */}
        <div className="relative px-4 pt-5">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3.5 shadow-inset">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300">
                Periodo activo
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-lime-300">
                <span className="h-1 w-1 animate-pulse-dot rounded-full bg-lime-300" />
                Abierto
              </span>
            </div>
            <p className="mt-1.5 font-display text-sm font-semibold text-white">
              Nómina mensual
            </p>
            <p className="mt-0.5 text-[11px] text-ink-300">
              Cálculo y volantes digitales
            </p>
          </div>
        </div>

        {/* Navegación */}
        <div className="relative flex-1 overflow-y-auto px-3 py-5">
          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="mb-6 last:mb-0">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-300">
                {grupo.titulo}
              </p>
              <nav className="mt-2 space-y-1">
                {grupo.enlaces.map(({ to, etiqueta, Icono }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/panel"}
                    onClick={onCerrar}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-white/[0.08] text-white shadow-inset"
                          : "text-ink-300 hover:bg-white/[0.05] hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-lime-400 transition-all duration-200 ${
                            isActive ? "opacity-100" : "opacity-0"
                          }`}
                        />
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-brand-500/20 text-lime-300"
                              : "bg-transparent text-ink-300 group-hover:text-ink-200"
                          }`}
                        >
                          <Icono className="h-[17px] w-[17px]" />
                        </span>
                        <span className="flex-1">{etiqueta}</span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-all ${
                            isActive
                              ? "translate-x-0 text-lime-300 opacity-100"
                              : "-translate-x-1 text-ink-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Empresa */}
        <div className="relative p-4">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-ink-300">
              <Building2 className="h-3.5 w-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]">
                Empresa
              </p>
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-ink-100">
              Transportes del Gran Caribe Colombiano S.C.A.
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-ink-300">
                <ShieldCheck className="h-3 w-3 text-lime-400" />
                Datos locales · TXT
              </span>
              <span className="font-mono text-[10px] text-ink-300">v1.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
