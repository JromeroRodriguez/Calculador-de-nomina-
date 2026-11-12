# Etapa 1: Compilación de la aplicación React con Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiestos e instalar dependencias aprovechando caché
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código fuente completo
COPY . .

# Inyectar la URL relativa para que las peticiones se sirvan mediante el proxy inverso de Nginx
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Compilar para producción
RUN npm run build

# Etapa 2: Servidor web de producción Nginx ligero
FROM nginx:1.27-alpine AS runner

# Copiar configuración optimizada para SPA y proxy inverso
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los artefactos estáticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto estándar HTTP
EXPOSE 80

# Chequeo de salud del contenedor frontend
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:80/ || exit 1

# Iniciar servidor Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
