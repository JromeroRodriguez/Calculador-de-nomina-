import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Consulta la API al montar el componente y ofrece una función de recarga.
 * La función de consulta se guarda en una referencia para evitar bucles.
 */
export function useApiQuery(queryFn, dependencias = []) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const queryRef = useRef(queryFn);
  queryRef.current = queryFn;

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    queryRef
      .current()
      .then((respuesta) => {
        if (activo) setData(respuesta);
      })
      .catch((fallo) => {
        if (activo) setError(fallo);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [...dependencias, version]);

  const recargar = useCallback(() => setVersion((actual) => actual + 1), []);

  return { data, cargando, error, recargar };
}
