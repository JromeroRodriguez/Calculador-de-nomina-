# Sistema de Gestión y Control de Nómina – TransCaribeCol

![Versión](https://img.shields.io/badge/Versi%C3%B3n-1.8.0-emerald)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.162-009688)
![React](https://img.shields.io/badge/Frontend-React_19_+_Vite_8-61DAFB)
![TailwindCSS](https://img.shields.io/badge/UI-Tailwind_CSS_3.4-38B2AC)
![Tests](https://img.shields.io/badge/Tests-44%2F44_Aprobados_(100%25)-brightgreen)
![Persistencia](https://img.shields.io/badge/Persistencia-Archivo_Plano_TXT-orange)

Plataforma integral y funcional para la liquidación, registro, auditoría y control de nómina de la empresa **Transportes del Gran Caribe Colombiano S.C.A. (TransCaribeCol)** — *NIT: 900.542.891-3*. Desarrollada bajo los lineamientos y especificaciones técnicas del **SENA**.

El sistema procesa dos categorías laborales distintas:
1. **Personal Administrativo:** Liquidación por horas ordinarias, recargo legal de horas extras (TPHE) y deducciones estándar.
2. **Personal Operativo (Trabajadores Oficiales):** Liquidación con asignación horaria automática por cargo, base de cotización integral (IBC al 40%) y aportes a ARL clasificados por nivel de riesgo laboral (Clases I, II y IV).

---

## Tabla de Contenidos

1. [Características Principales](#1-características-principales)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Módulos de Nómina y Fórmulas Matemáticas](#4-módulos-de-nómina-y-fórmulas-matemáticas)
5. [Persistencia e Integridad de Datos (`nomina.txt`)](#5-persistencia-e-integridad-de-datos-nominatxt)
6. [Generación de Documentos y Reportes (PDF y TXT)](#6-generación-de-documentos-y-reportes-pdf-y-txt)
7. [API REST y Catálogo de Endpoints](#7-api-rest-y-catálogo-de-endpoints)
8. [Despliegue Multiplataforma con Docker (Recomendado)](#8-despliegue-multiplataforma-con-docker-recomendado)
9. [Instalación Local Manual (Sin Docker)](#9-instalación-local-manual-sin-docker)
10. [Pruebas Automatizadas y Auditoría](#10-pruebas-automatizadas-y-auditoría)
11. [Seguridad y Reglas de Negocio](#11-seguridad-y-reglas-de-negocio)

---

## 1. Características Principales

* **Formulario de Registro Optimizado:**
  * Diseño centrado (`max-w-3xl`) con navegación visual en dos bloques: *01 Datos del empleado* y *02 Condiciones laborales*.
  * Capitalización automática de nombres propios en español (`capitalizar_nombre`), respetando conectores intermedios (`de`, `del`, `la`).
  * Despacho directo al comprobante individual generado sin fricción.
* **Seguridad y Fuente Única de Verdad:**
  * Las tarifas horarias (\$20.000 y \$40.000), horas automáticas y porcentajes de ARL (0.522%, 1.044%, 4.350%) residen **exclusivamente en el backend**. El frontend no puede inyectar ni forjar tarifas.
  * Bloqueo contra inyección de delimitadores (rechazo de `;` y saltos de línea).
* **Motor Matemático de Alta Precisión:**
  * Cálculos monetarios realizados con `decimal.Decimal` y redondeo legal al peso más cercano (`ROUND_HALF_UP`).
  * Conciliación contable exacta: $\text{Devengado} - \text{Deducciones} = \text{Neto a Pagar}$ al centavo / peso colombiano (\$0 COP de discrepancia).
* **Volantes de Pago y Planillas en PDF (Estándar A4):**
  * Dimensiones A4 profesionales (210 × 297 mm en vertical y horizontal).
  * Renderizado a 300 DPI (escala 2.5×) con fondo blanco limpio `#ffffff`.
  * Secciones formales de firmas para *Elaborado por (Coordinación de Nómina)* y *Aprobado por (Gerencia Financiera)*.
* **Reporte TXT Estructurado:**
  * Archivo en formato ASCII de 110 columnas con cabecera corporativa única.
  * Planilla general consolidada, balance de aportes/desembolsos y volantes individuales tabulados.
  * Soporte de descarga tanto en reporte formal como en archivo plano puro (`?formato=plano`).
* **Dashboard y Estadísticas Reales:**
  * Métricas calculadas en tiempo real directamente sobre el archivo de persistencia físico.

---

## 2. Arquitectura del Sistema

```text
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React 19 + Vite 8)                   │
│   • Tailwind CSS 3.4   • Lucide React   • React Router 7    │
│   • Generador PDF A4 (html2canvas + jsPDF)                  │
│   • Visor Interactivo TXT + Portapapeles                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / HTTP (CORS restringido)
┌──────────────────────────────▼──────────────────────────────┐
│              BACKEND (FastAPI + Pydantic v2)                │
│   • app.main: API REST, ciclo de vida lifespan, CORS        │
│   • app.models.schemas: Validación estricta con Pydantic v2 │
│   • app.services.calculadora_nomina: Despachador de cálculo │
│   • app.services.archivo_txt: RLock, persistencia y reporte │
└──────────────────────────────┬──────────────────────────────┘
                               │ Lectura / Escritura con threading.RLock
┌──────────────────────────────▼──────────────────────────────┐
│            ARCHIVO DE PERSISTENCIA PLANO                    │
│   • backend/app/data/nomina.txt (UTF-8, 11 columnas con ;)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura del Proyecto

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py                      # FastAPI app, configuración CORS y handlers
│   │   ├── constantes.py                # Tarifas, porcentajes, ARL y capitalizar_nombre
│   │   ├── models/
│   │   │   └── schemas.py               # Modelos Pydantic v2 de entrada y salida
│   │   ├── routes/
│   │   │   ├── configuracion.py         # Catálogo de cargos y tarifas
│   │   │   ├── empleados.py             # Empleados únicos derivados del historial
│   │   │   └── nomina.py                # Calcular, confirmar, historial, TXT, estadísticas
│   │   ├── services/
│   │   │   ├── archivo_txt.py           # Persistencia atómica, lectura y reporte TXT
│   │   │   ├── calculadora_nomina.py    # Orquestador de liquidaciones
│   │   │   ├── calculo_administrativo.py# Reglas de negocio Módulo A
│   │   │   ├── calculo_operativo.py     # Reglas de negocio Módulo B (IBC + ARL)
│   │   │   └── consultas_nomina.py      # Agrupaciones y estadísticas
│   │   └── data/
│   │       ├── nomina.txt               # Archivo plano de persistencia principal
│   │       └── nomina.backup.txt        # Copias de seguridad automáticas
│   ├── tests/
│   │   ├── conftest.py                  # Fixtures temporales y aislamiento
│   │   ├── test_api.py                  # Pruebas de integración HTTP y validaciones
│   │   ├── test_archivo_txt.py          # Pruebas de concurrencia y formato TXT
│   │   └── test_calculos.py             # Pruebas aritméticas y redondeo al peso
│   ├── pytest.ini
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, VolantePago, PageHeader
│   │   ├── pages/                       # Dashboard, RegistrarEmpleado, ExportarTxt...
│   │   ├── services/                    # Cliente HTTP Axios / fetch para la API
│   │   ├── utils/
│   │   │   ├── format.js                # Moneda COP, porcentajes y capitalizarNombre
│   │   │   └── pdf.js                   # Motor A4, 300 DPI, multi-página para PDF
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── README.md
```

---

## 4. Módulos de Nómina y Fórmulas Matemáticas

### Módulo A – Empleados Administrativos

Liquidación pensada para personal de oficina y dirección.

| Concepto | Fórmula / Valor | Detalle |
| :--- | :--- | :--- |
| **Tarifa Hora Ordinaria** | $\$20.000\text{ COP}$ | Tarifa fija institucional. |
| **Tarifa Hora Extra** | $\$20.000 \times 1.25 = \mathbf{\$25.000\text{ COP}}$ | Recargo legal del 25%. |
| **Salario Ordinario** | $\text{HT} \times \$20.000$ | Horas trabajadas ordinarias. |
| **Total Pago Horas Extras (TPHE)** | $\text{HE} \times \$25.000$ | Pago total por concepto de horas extras. |
| **Total Devengado** | $\text{Salario} + \text{TPHE}$ | Base bruta de liquidación. |
| **Aporte Salud (4%)** | $\text{Total Devengado} \times 0.04$ | Deducción obligatoria empleado. |
| **Aporte Pensión (4%)** | $\text{Total Devengado} \times 0.04$ | Deducción obligatoria empleado. |
| **Aporte ARL (Clase I)** | $\text{Total Devengado} \times 0.00522$ | Tarifa Riesgo Clase I (0.522%). |
| **Total Deducciones** | $\text{Salud} + \text{Pensión} + \text{ARL}$ | Sumatoria de descuentos. |
| **Total Neto a Pagar** | $\text{Total Devengado} - \text{Total Deducciones}$ | Desembolso final al trabajador. |

> [!NOTE]
> En el personal administrativo, las horas extras (TPHE) **sí forman parte de la base gravable** para el cálculo de Salud, Pensión y ARL.

---

### Módulo B – Empleados Operativos (Trabajadores Oficiales)

Liquidación para personal de campo o transporte. El usuario únicamente escoge el cargo; las horas y el nivel de riesgo se determinan automáticamente.

| Cargo Operativo | Horas Asignadas (HT) | Salario Bruto ($\text{HT} \times \$40.000$) | Clase Riesgo ARL | Tarifa ARL |
| :--- | :---: | :---: | :---: | :---: |
| **Conductor** | 160 h | $\$6.400.000$ | **Clase II** | $1.044\%$ |
| **Oficios Generales** | 100 h | $\$4.000.000$ | **Clase I** | $0.522\%$ |
| **Vigilancia** | 336 h | $\$13.440.000$ | **Clase IV** | $4.350\%$ |

#### Fórmulas Operativas:
1. **Ingreso Base de Cotización (IBC):**
   $$\text{IBC} = \text{Salario Bruto} \times 40\%$$
2. **Aportes de Seguridad Social Integral:**
   * **Salud:** $\text{IBC} \times 12.5\%$
   * **Pensión:** $\text{IBC} \times 16.0\%$
   * **ARL:** $\text{IBC} \times \text{Porcentaje ARL del Cargo}$
3. **Total Deducciones:**
   $$\text{Deducciones} = \text{Salud} + \text{Pensión} + \text{ARL}$$
4. **Total a Pagar:**
   $$\text{Total a Pagar} = \text{Salario Bruto} - \text{Total Deducciones}$$

---

## 5. Persistencia e Integridad de Datos (`nomina.txt`)

* **Ubicación Física:** `backend/app/data/nomina.txt`.
* **Codificación:** UTF-8 estricto sin BOM, saltos de línea LF (`\n`).
* **Estructura:** 11 columnas delimitadas por punto y coma (`;`):
  ```text
  Nombre;Tipo;Cargo;HT;Salario;HE;TPHE;Salud;Pension;ARL;Total a pagar
  ```
* **Concurrencia:** Lectura y escritura sincronizadas mediante `threading.RLock()`.
* **Manejo de Errores:** Si se detecta una línea corrupta, el servicio la omite de forma segura en las lecturas registrando un log de advertencia, sin afectar ni corromper las demás líneas válidas.

---

## 6. Generación de Documentos y Reportes (PDF y TXT)

### Generador de PDF Profesional (`frontend/src/utils/pdf.js`)
* **Dimensiones Oficiales:** Formato estándar internacional ISO 216 / A4 ($595.28 \times 841.89\text{ pt}$ en vertical y $841.89 \times 595.28\text{ pt}$ en horizontal).
* **Calidad de Impresión:** Factor de escala $2.5\times$ (~300 DPI) para evitar pixelado en textos y valores numéricos.
* **Paginación Inteligente:** Slicing de canvas multi-página con numeración formal (`Página X de Y`) y márgenes uniformes de $28\text{ pt}$ (~$10\text{ mm}$).
* **Sin Salto de Líneas Inesperado:** Celdas monetarias aseguradas con clase `whitespace-nowrap`.

### Reporte TXT Estructurado (`backend/app/services/archivo_txt.py`)
Genera un archivo de texto descargable alineado a 110 columnas que contiene:
1. Encabezado corporativo institucional (TransCaribeCol NIT 900.542.891-3).
2. Planilla General Consolidada con columnas uniformemente tabuladas.
3. Resumen consolidado de aportes patronales y desembolsos.
4. Desglose pormenorizado de cada volante de pago individual.

---

## 7. API REST y Catálogo de Endpoints

Base URL: `http://localhost:8001/api`

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/health` | Chequeo de salud del servicio y versión activa. |
| `GET` | `/configuracion` | Catálogo de tarifas, horas automáticas y riesgos. |
| `GET` | `/empleados` | Listado consolidado de trabajadores únicos. |
| `POST` | `/nomina/calcular` | Simula la liquidación sin persistir en el archivo. |
| `POST` | `/nomina/confirmar` | Liquida, valida y guarda atómicamente en `nomina.txt`. |
| `GET` | `/nomina` | Historial completo de volantes registrados. |
| `GET` | `/nomina/{id}` | Consulta detallada del comprobante por consecutivo. |
| `GET` | `/nomina/estadisticas`| Totales consolidados de nómina procesada y conteos. |
| `GET` | `/nomina/exportar` | Descarga el archivo TXT (Reporte o Plano con `?formato=plano`). |

---

## 8. Despliegue Multiplataforma con Docker (Recomendado)

La aplicación está completamente dockerizada para funcionar de manera homogénea en **Linux, macOS (Intel y Apple Silicon) y Windows (con Docker Desktop / WSL2)**, sin necesidad de instalar Python, Node.js ni configurar entornos virtuales locales.

### Arquitectura de Contenedores

```text
┌─────────────────────────────────────────────────────────────┐
│                   transcaribecol-frontend                   │
│   • Nginx 1.27 Alpine (Servidor web de producción)          │
│   • Multi-stage build con Node 22 Alpine                    │
│   • Puerto expuesto: 8088 (configurable)                    │
│   • Proxy inverso transparente /api -> backend:8000         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Red interna puente (nomina-network)
┌──────────────────────────────▼──────────────────────────────┐
│                    transcaribecol-backend                   │
│   • Python 3.12 Slim (FastAPI + Uvicorn)                    │
│   • Puerto expuesto: 8001 (interno: 8000)                   │
│   • Healthcheck automático integrado                        │
│   • Volumen persistente montado en host:                    │
│     ./backend/app/data -> /app/app/data                     │
└─────────────────────────────────────────────────────────────┘
```

### Ejecución en un solo comando

```bash
# Iniciar frontend y backend compilados y en segundo plano
docker compose up --build -d
```

Una vez iniciado, la aplicación estará disponible inmediatamente:
* **Aplicación Web (Frontend + Proxy):** <http://localhost:8088>
* **API Backend directa:** <http://localhost:8001>
* **Documentación interactiva Swagger:** <http://localhost:8088/docs> o <http://localhost:8001/docs>
* **Verificación de Salud:** <http://localhost:8088/api/health>

### Comandos útiles de Docker

```bash
# Ver estado y healthcheck de los contenedores
docker compose ps

# Ver logs en tiempo real de toda la plataforma
docker compose logs -f

# Detener los contenedores conservando los datos persistentes
docker compose down

# Personalizar puertos publicados si 8088 u 8001 están ocupados:
FRONTEND_PORT=8089 BACKEND_PORT=8002 docker compose up -d
```

> [!TIP]
> Los datos de nómina registrados en la aplicación dockerizada se guardan en tiempo real en `./backend/app/data/nomina.txt` de tu máquina anfitriona gracias al volumen enlazado (*bind-mount*). Nunca perderás tus registros al apagar o reconstruir los contenedores.

---

## 9. Instalación Local Manual (Sin Docker)

Si prefieres ejecutar el sistema directamente en tu sistema operativo sin contenedores:

### Requisitos Previos
* **Python:** 3.10 o superior (recomendado Python 3.12).
* **Node.js:** Versión 20.19.0 o superior (compatible con Vite 8).
* **npm:** Gestor de paquetes de Node.

### Paso 1: Configurar y Ejecutar el Backend (Terminal 1)

```bash
cd backend

# Crear entorno virtual
python3 -m venv .venv

# Activar entorno virtual
# En Linux/macOS:
source .venv/bin/activate
# En Windows (PowerShell):
# .venv\Scripts\Activate.ps1

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor con recarga automática
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

El backend quedará accesible en:
* API: `http://127.0.0.1:8001`
* Documentación Swagger: `http://127.0.0.1:8001/docs`
* Endpoint de Salud: `http://127.0.0.1:8001/api/health`

### Paso 2: Configurar y Ejecutar el Frontend (Terminal 2)

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend se abrirá en `http://localhost:5174`.

---

## 10. Pruebas Automatizadas y Auditoría

### Ejecución de Pruebas Unitarias
El proyecto cuenta con una cobertura integral de 44 pruebas unitarias e integrales escritas con `pytest`:

```bash
# Desde la carpeta backend (con el entorno virtual activo):
pytest -v
```

```text
======================== 44 passed in 0.39s =========================
```

### Resumen de la Auditoría Técnica y Financiera
* **Discrepancia Matemática:** **\$0 COP** (100% de exactitud contable).
* **Redondeo:** Cumplimiento estricto de la regla colombiana `ROUND_HALF_UP` al peso entero.
* **Integridad del Archivo:** Cero pérdidas de datos, sin registros corruptos, bloqueo `RLock` activo.
* **Veredicto:** **APROBADO CON HONORES**.

---

## 11. Seguridad y Reglas de Negocio

1. **Inmutabilidad de Parámetros:**
   El frontend únicamente transmite `nombre`, `tipo`, `cargo`, y en el caso administrativo `horas_trabajadas` y `horas_extras`. Todo lo demás es descartado o verificado contra los catálogos del servidor (`extra="forbid"`).
2. **Exclusión de Horas Extras en Operativos:**
   Cualquier intento de enviar horas extras o horas manuales para un operario resulta en un error HTTP `422 Unprocessable Entity` con mensaje explícito en español.
3. **Sanitización de Caracteres:**
   Se limpian espacios en blanco sobrantes y se rechazan activamente delimitadores como `;` en campos de texto para evitar ataques de inyección en archivos planos.

---

**TransCaribeCol S.C.A. · Sistema de Gestión de Nómina SENA**  
*Desarrollado para fines académicos y de control administrativo.*
