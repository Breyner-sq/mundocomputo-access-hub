# 🧪 Documentación de Pruebas Automatizadas

Sistema completo de pruebas para el proyecto de gestión de inventario, productos y ventas.

## 📋 Tabla de Contenidos

- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura de Pruebas](#estructura-de-pruebas)
- [Instalación](#instalación)
- [Ejecución de Pruebas](#ejecución-de-pruebas)
- [Casos de Prueba](#casos-de-prueba)
- [Reportes](#reportes)
- [CI/CD](#cicd)

## 🛠️ Tecnologías Utilizadas

- **Vitest**: Framework de pruebas unitarias y de integración (alternativa moderna a Jest para Vite)
- **React Testing Library**: Pruebas de componentes React
- **Playwright**: Pruebas end-to-end (E2E)
- **@testing-library/user-event**: Simulación de interacciones de usuario
- **@testing-library/jest-dom**: Matchers adicionales para aserciones DOM

## 📁 Estructura de Pruebas

```
tests/
├── setup.ts                          # Configuración global de pruebas
├── mockData/                         # Datos simulados para pruebas
│   ├── users.ts                      # Usuarios de prueba
│   ├── products.ts                   # Productos y categorías
│   └── sales.ts                      # Ventas, clientes e inventario
├── unit/                             # Pruebas unitarias
│   ├── components/
│   │   └── ProtectedRoute.test.tsx  # Rutas protegidas
│   └── pages/
│       └── Auth.test.tsx             # Autenticación
├── integration/                      # Pruebas de integración
│   ├── products.test.tsx             # Gestión de productos
│   ├── sales.test.tsx                # Proceso de ventas
│   └── inventory.test.tsx            # Control de inventario
└── e2e/                              # Pruebas end-to-end
    ├── auth.spec.ts                  # Flujos de autenticación
    ├── products.spec.ts              # Gestión completa de productos
    ├── sales.spec.ts                 # Proceso completo de ventas
    └── inventory.spec.ts             # Gestión de inventario
```

## 📦 Instalación

Las dependencias ya están instaladas. Si necesitas reinstalarlas:

```bash
npm install
```

Dependencias de pruebas:
- vitest
- @testing-library/react
- @testing-library/jest-dom
- @testing-library/user-event
- @vitest/ui
- jsdom
- @playwright/test

## ▶️ Ejecución de Pruebas

### Pruebas Unitarias y de Integración (Vitest)

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar en modo watch (desarrollo)
npm run test:watch

# Ejecutar con interfaz UI
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

### Pruebas End-to-End (Playwright)

```bash
# Instalar navegadores (primera vez)
npx playwright install

# Ejecutar pruebas E2E
npm run test:e2e

# Ejecutar en modo UI (interactivo)
npm run test:e2e:ui

# Ver reporte HTML
npm run test:e2e:report
```

## ✅ Casos de Prueba

### 1. Autenticación

#### Pruebas Unitarias (`tests/unit/pages/Auth.test.tsx`)
- ✅ Renderiza formulario de login
- ✅ Permite ingresar credenciales válidas
- ✅ Muestra error con credenciales incorrectas
- ✅ Redirige después de login exitoso
- ✅ Deshabilita botón mientras carga
- ✅ Permite mostrar/ocultar contraseña
- ✅ Valida campos no vacíos

#### Pruebas E2E (`tests/e2e/auth.spec.ts`)
- ✅ Muestra página de login
- ✅ Error con credenciales inválidas
- ✅ Toggle de contraseña
- ✅ Validación de campos requeridos
- ✅ Botón deshabilitado durante carga

### 2. Gestión de Productos

#### Pruebas de Integración (`tests/integration/products.test.tsx`)
- ✅ Crear producto con datos válidos
- ✅ Rechazar producto con datos inválidos
- ✅ Actualizar producto existente
- ✅ Eliminar producto sin inventario
- ✅ Prevenir eliminación con inventario
- ✅ Listar y filtrar productos
- ✅ Validaciones de negocio (stock, precio, nombre)

#### Pruebas E2E (`tests/e2e/products.spec.ts`)
- 📝 Navegar a productos (placeholder)
- 📝 Crear, editar y eliminar productos
- 📝 Validaciones en formularios
- 📝 Exportar a PDF
- 📝 Filtros y búsqueda

### 3. Proceso de Ventas

#### Pruebas de Integración (`tests/integration/sales.test.tsx`)
- ✅ Crear venta con productos disponibles
- ✅ Calcular total correctamente
- ✅ Verificar stock antes de venta
- ✅ Rechazar venta sin stock suficiente
- ✅ Descontar inventario después de venta
- ✅ Validar datos de venta (cantidad, precio)
- ✅ Generar comprobante con datos completos
- ✅ Restricciones de acceso por rol

#### Pruebas E2E (`tests/e2e/sales.spec.ts`)
- 📝 Flujo completo de venta
- 📝 Validación de stock
- 📝 Cálculo automático de totales
- 📝 Generación de comprobante
- 📝 Historial de ventas

### 4. Control de Inventario

#### Pruebas de Integración (`tests/integration/inventory.test.tsx`)
- ✅ Crear lote de inventario
- ✅ Validar cantidad y precio positivos
- ✅ Calcular stock total por producto
- ✅ Identificar productos con stock bajo
- ✅ Actualizar stock después de ventas
- ✅ Prevenir stock negativo
- ✅ Verificar integridad de datos
- ✅ Restricciones de acceso por rol

#### Pruebas E2E (`tests/e2e/inventory.spec.ts`)
- 📝 Gestión de lotes
- 📝 Alertas de stock bajo
- 📝 Trazabilidad de movimientos
- 📝 Integridad después de ventas

### 5. Rutas Protegidas

#### Pruebas Unitarias (`tests/unit/components/ProtectedRoute.test.tsx`)
- ✅ Muestra loading mientras carga
- ✅ Redirige si no hay usuario
- ✅ Redirige si rol no permitido
- ✅ Muestra contenido con rol correcto
- ✅ Permite múltiples roles

## 📊 Reportes

### Reporte de Cobertura (Vitest)

Después de ejecutar `npm run test:coverage`, se genera un reporte HTML en:
```
coverage/index.html
```

Abre el archivo en tu navegador para ver:
- Porcentaje de cobertura por archivo
- Líneas cubiertas y no cubiertas
- Funciones y ramas probadas

### Reporte E2E (Playwright)

Después de ejecutar `npm run test:e2e`, se genera un reporte en:
```
playwright-report/index.html
```

Para verlo:
```bash
npm run test:e2e:report
```

El reporte incluye:
- Resultados de cada test
- Screenshots de fallos
- Traces de ejecución
- Tiempos de ejecución

## 🔄 CI/CD

### GitHub Actions

Se incluye un workflow de CI/CD en `.github/workflows/tests.yml` que:

1. ✅ Ejecuta pruebas unitarias e integración
2. ✅ Ejecuta pruebas E2E
3. ✅ Genera reportes de cobertura
4. ✅ Sube artefactos de reportes
5. ✅ Se ejecuta en cada push y pull request

### Configuración del Workflow

```yaml
- Trigger: push, pull_request
- Node.js: 18.x
- Navegadores: Chromium, Firefox
- Reportes: Subidos como artefactos
```

## 📝 Datos de Prueba (Mock Data)

### Usuarios
- **Admin**: `admin@test.com` / `Admin123!`
- **Ventas**: `ventas@test.com` / `Ventas123!`
- **Inventario**: `inventario@test.com` / `Inventario123!`

### Productos
- Laptop HP ($1,200.00)
- Mouse Logitech ($25.00)

### Categorías
- Electrónica
- Ropa

### Clientes
- Juan Pérez (1234567890)
- María González (0987654321)

## 🎯 Métricas de Calidad

### Objetivos de Cobertura
- **Líneas**: > 80%
- **Funciones**: > 80%
- **Ramas**: > 75%

### Tipos de Pruebas
- ✅ **Unitarias**: Componentes y funciones aisladas
- ✅ **Integración**: Interacción entre módulos
- 📝 **E2E**: Flujos completos de usuario (placeholders para implementación futura)

## 🚀 Próximos Pasos

1. **Implementar pruebas E2E completas**
   - Requiere configurar usuarios de prueba en Supabase
   - Implementar flujos completos de usuario

2. **Agregar pruebas de rendimiento**
   - Lighthouse CI
   - Métricas de Web Vitals

3. **Pruebas de accesibilidad**
   - jest-axe
   - Validación WCAG

4. **Pruebas de regresión visual**
   - Percy o Chromatic
   - Screenshots comparativos

## 🐛 Troubleshooting

### Problema: "Cannot find module '@/...'"
**Solución**: Verifica que el alias esté configurado en `vitest.config.ts`

### Problema: "Test timeout"
**Solución**: Aumenta el timeout en la configuración de Playwright o Vitest

### Problema: "Browser not installed"
**Solución**: Ejecuta `npx playwright install`

### Problema: "Port 8080 already in use"
**Solución**: Cierra otros procesos en el puerto 8080 o cambia el puerto en `playwright.config.ts`

## 📚 Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 👥 Contribuir

Para agregar nuevas pruebas:

1. Crea el archivo en la carpeta correspondiente
2. Usa los mocks existentes o crea nuevos
3. Sigue la convención de nombres: `*.test.tsx` o `*.spec.ts`
4. Ejecuta las pruebas localmente
5. Verifica la cobertura

---

**Nota**: Las pruebas E2E están implementadas como placeholders (`.skip()`) porque requieren:
- Usuarios reales en Supabase
- Datos de prueba en la base de datos
- Configuración de autenticación para testing

Para implementarlas completamente, configura un entorno de testing separado con datos de prueba.
