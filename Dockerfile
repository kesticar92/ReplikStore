# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./
COPY .eslintrc.json ./
COPY .prettierrc ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY src/ ./src/

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --only=production

# Copiar archivos construidos
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start:prod"] 