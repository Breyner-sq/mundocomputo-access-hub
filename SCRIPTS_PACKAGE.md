# Scripts a Agregar en package.json

Por favor, agrega estos scripts manualmente a la sección "scripts" de tu `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview",
  
  // ⬇️ AGREGAR ESTOS NUEVOS SCRIPTS ⬇️
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:report": "playwright show-report"
}
```

## Comandos para ejecutar:

### Pruebas Unitarias e Integración:
```bash
npm test              # Ejecutar todas las pruebas
npm run test:watch    # Modo desarrollo (watch)
npm run test:ui       # Interfaz visual
npm run test:coverage # Con reporte de cobertura
```

### Pruebas E2E:
```bash
npx playwright install  # Primera vez: instalar navegadores
npm run test:e2e       # Ejecutar pruebas E2E
npm run test:e2e:ui    # Modo interactivo
npm run test:e2e:report # Ver reporte HTML
```
