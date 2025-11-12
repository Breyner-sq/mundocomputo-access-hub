# Mundo Computo Access Hub - Docker Deployment

## 🐳 Guía de Despliegue con Docker

Este documento describe cómo desplegar la aplicación Mundo Computo Access Hub usando Docker.

## 📋 Prerequisitos

- Docker instalado (versión 20.10 o superior)
- Docker Compose instalado (versión 1.29 o superior)
- Conexión a Supabase ya configurada (base de datos desplegada)

## 🚀 Opciones de Despliegue

### Opción 1: Usando Docker directamente

#### 1. Construir la imagen

```bash
docker build -t mundocomputo-access-hub:latest .
```

#### 2. Ejecutar el contenedor

```bash
docker run -d \
  --name mundocomputo-app \
  -p 80:80 \
  --restart unless-stopped \
  mundocomputo-access-hub:latest
```

#### 3. Verificar que está corriendo

```bash
docker ps
docker logs mundocomputo-app
```

### Opción 2: Usando Docker Compose (Recomendado)

#### 1. Construir y ejecutar

```bash
docker-compose up -d
```

#### 2. Ver logs

```bash
docker-compose logs -f
```

#### 3. Detener la aplicación

```bash
docker-compose down
```

## 🔧 Configuración

### Variables de Entorno

Si tu aplicación necesita variables de entorno (como credenciales de Supabase), puedes:

1. **Crear un archivo `.env`** en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

2. **Modificar el docker-compose.yml** para incluir el archivo:

```yaml
services:
  mundocomputo-app:
    env_file:
      - .env
```

3. **O pasar variables directamente al comando docker run**:

```bash
docker run -d \
  --name mundocomputo-app \
  -p 80:80 \
  -e VITE_SUPABASE_URL=tu_url \
  -e VITE_SUPABASE_ANON_KEY=tu_clave \
  --restart unless-stopped \
  mundocomputo-access-hub:latest
```

## 📦 Características del Dockerfile

- **Multi-stage build**: Optimiza el tamaño final de la imagen
- **Bun**: Usa Bun para instalación rápida de dependencias
- **Nginx Alpine**: Servidor web ligero para servir la aplicación
- **Gzip**: Compresión habilitada para mejor rendimiento
- **Cache**: Headers de cache configurados para assets estáticos
- **SPA Routing**: Configuración para React Router (todas las rutas redirigen a index.html)
- **Health Check**: Verificación automática del estado de la aplicación

## 🔍 Verificación

Una vez desplegado, puedes verificar:

1. **Acceder a la aplicación**: http://localhost
2. **Ver logs**: `docker logs mundocomputo-app`
3. **Verificar salud**: `docker inspect --format='{{json .State.Health}}' mundocomputo-app`

## 🌐 Despliegue en Producción

### Usando un puerto diferente

```bash
docker run -d \
  --name mundocomputo-app \
  -p 8080:80 \
  mundocomputo-access-hub:latest
```

### Con un dominio y reverse proxy (Nginx/Traefik)

Si usas un reverse proxy, configura:

```nginx
server {
    listen 80;
    server_name tudominio.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🛠️ Comandos Útiles

```bash
# Reconstruir la imagen
docker-compose build --no-cache

# Ver estadísticas de recursos
docker stats mundocomputo-app

# Acceder al contenedor
docker exec -it mundocomputo-app sh

# Eliminar todo (contenedor e imagen)
docker-compose down --rmi all

# Ver tamaño de la imagen
docker images mundocomputo-access-hub
```

## 📊 Optimizaciones

La imagen final es aproximadamente **~40MB** gracias a:
- Alpine Linux como base
- Multi-stage build (no incluye node_modules en producción)
- Solo archivos de dist necesarios
- Nginx optimizado

## 🔐 Seguridad

Recomendaciones de seguridad:

1. **No incluyas credenciales en el Dockerfile**
2. **Usa variables de entorno para secretos**
3. **Actualiza regularmente las imágenes base**
4. **Usa HTTPS en producción**
5. **Configura firewall adecuadamente**

## 📝 Notas

- La carpeta `supabase` está excluida del build (`.dockerignore`)
- El puerto por defecto es 80, pero puedes cambiarlo
- El contenedor se reinicia automáticamente si falla
- La aplicación está optimizada para producción con build de Vite

## 🆘 Troubleshooting

### El contenedor no inicia

```bash
docker logs mundocomputo-app
```

### La aplicación no carga

Verifica que el build se haya completado correctamente:

```bash
docker exec -it mundocomputo-app ls -la /usr/share/nginx/html
```

### Problemas de conexión a Supabase

Verifica que las variables de entorno estén correctamente configuradas y que Supabase esté accesible desde el contenedor.
