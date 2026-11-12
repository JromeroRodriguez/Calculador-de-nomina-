const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8001/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(mensaje, estado = 0, datos = null) {
    super(mensaje);
    this.name = "ApiError";
    this.estado = estado;
    this.datos = datos;
  }
}

function extraerMensaje(cuerpo, estado) {
  if (cuerpo && typeof cuerpo === "object") {
    if (typeof cuerpo.detail === "string" && cuerpo.detail.trim()) {
      return cuerpo.detail;
    }
    if (Array.isArray(cuerpo.detail) && cuerpo.detail.length > 0) {
      return cuerpo.detail
        .map((error) => error.msg || "Dato inválido")
        .join(". ");
    }
    if (typeof cuerpo.message === "string" && cuerpo.message.trim()) {
      return cuerpo.message;
    }
  }
  if (estado) {
    return `La solicitud no pudo completarse (código ${estado}).`;
  }
  return "La solicitud no pudo completarse.";
}

async function leerCuerpo(respuesta) {
  const tipoContenido = respuesta.headers.get("content-type") || "";
  if (tipoContenido.includes("application/json")) {
    try {
      return await respuesta.json();
    } catch {
      return null;
    }
  }
  try {
    return await respuesta.text();
  } catch {
    return null;
  }
}

async function solicitar(ruta, opciones = {}) {
  const { headers, ...resto } = opciones;
  let respuesta;

  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, {
      ...resto,
      headers: {
        Accept: "application/json",
        ...(resto.body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Verifique que el backend esté en ejecución en http://localhost:8001.",
    );
  }

  const cuerpo = await leerCuerpo(respuesta);
  if (!respuesta.ok) {
    throw new ApiError(
      extraerMensaje(cuerpo, respuesta.status),
      respuesta.status,
      cuerpo,
    );
  }
  return cuerpo;
}

function jsonBody(datos) {
  return { method: "POST", body: JSON.stringify(datos) };
}

export function obtenerConfiguracion() {
  return solicitar("/configuracion");
}

export function calcularNomina(datos) {
  return solicitar("/nomina/calcular", jsonBody(datos));
}

export function confirmarNomina(datos) {
  return solicitar("/nomina/confirmar", jsonBody(datos));
}

export function obtenerHistorial() {
  return solicitar("/nomina");
}

export function obtenerEstadisticas() {
  return solicitar("/nomina/estadisticas");
}

export function obtenerEmpleados() {
  return solicitar("/empleados");
}

export function obtenerNomina(id) {
  return solicitar(`/nomina/${id}`);
}

export async function obtenerTextoNomina(formato = "reporte") {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}/nomina/exportar?formato=${encodeURIComponent(formato)}`, {
      headers: { Accept: "text/plain" },
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor para obtener el archivo TXT.",
    );
  }

  if (!respuesta.ok) {
    const cuerpo = await leerCuerpo(respuesta);
    throw new ApiError(
      extraerMensaje(cuerpo, respuesta.status),
      respuesta.status,
      cuerpo,
    );
  }
  return respuesta.text();
}

export async function descargarNomina(formato = "reporte") {
  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}/nomina/exportar?formato=${encodeURIComponent(formato)}`, {
      headers: { Accept: "text/plain" },
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor para descargar el TXT.");
  }

  if (!respuesta.ok) {
    const cuerpo = await leerCuerpo(respuesta);
    throw new ApiError(
      extraerMensaje(cuerpo, respuesta.status),
      respuesta.status,
      cuerpo,
    );
  }
  return respuesta.blob();
}

export { API_BASE };
