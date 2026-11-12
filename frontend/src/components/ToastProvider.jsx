import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const estilos = {
  exito: {
    borde: "border-brand-200",
    icono: "bg-brand-50 text-brand-600",
    Icono: CheckCircle2,
  },
  error: {
    borde: "border-red-200",
    icono: "bg-red-50 text-red-500",
    Icono: AlertCircle,
  },
  info: {
    borde: "border-sky-200",
    icono: "bg-sky-50 text-sky-500",
    Icono: Info,
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const contador = useRef(0);
  const temporizadores = useRef(new Map());

  const cerrar = useCallback((id) => {
    const temporizador = temporizadores.current.get(id);
    if (temporizador) {
      window.clearTimeout(temporizador);
      temporizadores.current.delete(id);
    }
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
  }, []);

  const notificar = useCallback(
    (mensaje, tipo = "exito") => {
      const id = ++contador.current;
      setToasts((actuales) => [...actuales, { id, mensaje, tipo }]);
      const duracion = tipo === "error" ? 6500 : 4500;
      const temporizador = window.setTimeout(() => cerrar(id), duracion);
      temporizadores.current.set(id, temporizador);
      return id;
    },
    [cerrar],
  );

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => {
      pendientes.forEach((temporizador) => window.clearTimeout(temporizador));
      pendientes.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ notificar }}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm"
      >
        {toasts.map((toast) => {
          const estilo = estilos[toast.tipo] || estilos.info;
          const Icono = estilo.Icono;
          return (
            <div
              key={toast.id}
              role="status"
              className={`animate-toast pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-white p-4 shadow-lift ${estilo.borde}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${estilo.icono}`}
              >
                <Icono className="h-[18px] w-[18px]" />
              </span>
              <p className="flex-1 pt-0.5 text-sm font-medium leading-5 text-ink-700">
                {toast.mensaje}
              </p>
              <button
                type="button"
                onClick={() => cerrar(toast.id)}
                className="rounded-lg p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-600"
                aria-label="Cerrar notificación"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }
  return contexto;
}
