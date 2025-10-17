# Scripts Actualizados para package.json

Por favor, reemplaza la sección "scripts" de tu `package.json` con estos scripts corregidos:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:report": "playwright show-report",
  "test:all": "npm run test && npm run test:e2e"
}
```

## Cambios Importantes:

### Separación de Pruebas:
- **`npm test`** → Solo ejecuta pruebas unitarias e integración con Vitest (tests/unit y tests/integration)
- **`npm run test:e2e`** → Solo ejecuta pruebas E2E con Playwright (tests/e2e)
- **`npm run test:all`** → Ejecuta todas las pruebas (unitarias, integración y E2E)

### Configuración actualizada:
- `vitest.config.ts` ahora excluye la carpeta `tests/e2e/`
- `playwright.config.ts` solo ejecuta archivos en `tests/e2e/`
- No hay conflicto entre ambos frameworks

## Comandos para ejecutar:

```bash
# Pruebas Unitarias e Integración (Vitest)
npm test              # Ejecutar pruebas unitarias e integración
npm run test:watch    # Modo desarrollo (watch)
npm run test:ui       # Interfaz visual
npm run test:coverage # Con reporte de cobertura

# Pruebas E2E (Playwright)
npx playwright install  # Primera vez: instalar navegadores
npm run test:e2e       # Ejecutar pruebas E2E
npm run test:e2e:ui    # Modo interactivo
npm run test:e2e:report # Ver reporte HTML

# Todas las pruebas
npm run test:all       # Ejecutar todo el conjunto de pruebas
```

## Correcciones aplicadas:

✅ Separación correcta entre pruebas Vitest y Playwright  
✅ `vitest.config.ts` excluye `tests/e2e/`  
✅ Botón de contraseña con `aria-label` y `data-testid`  
✅ BrowserRouter con flags `future` para eliminar warnings  
✅ Scripts separados para cada tipo de prueba
