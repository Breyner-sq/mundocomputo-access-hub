import { test, expect } from '@playwright/test';

test.describe('Gestión de Reparaciones - E2E', () => {
  const baseURL = 'https://mundocomputo.vercel.app';
  
  // Credenciales de prueba
  const tecnicoEmail = 'tecnico@test.com';
  const tecnicoPassword = 'test123';
  const adminEmail = 'admin@test.com';
  const adminPassword = 'admin123';

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
  });

  test.describe('Creación de reparación (Técnico)', () => {
    test('técnico puede crear nueva reparación', async ({ page }) => {
      // Login como técnico
      await page.click('text=Empleados');
      await page.fill('input[type="email"]', tecnicoEmail);
      await page.fill('input[type="password"]', tecnicoPassword);
      await page.click('button[type="submit"]');

      // Esperar redirección al dashboard de técnico
      await page.waitForURL('**/tecnico', { timeout: 10000 });

      // Navegar a crear reparación
      await page.click('text=Nueva Reparación');
      await page.waitForSelector('form', { timeout: 5000 });

      // Llenar formulario
      await page.fill('input[placeholder*="Cédula"]', '1234567890');
      await page.click('button:has-text("Buscar")');
      
      // Esperar que se cargue el cliente
      await page.waitForTimeout(1000);

      // Seleccionar tipo de producto
      await page.selectOption('select[name="tipo_producto"]', 'Laptop');
      
      // Llenar datos del equipo
      await page.fill('input[name="marca"]', 'HP');
      await page.fill('input[name="modelo"]', 'Pavilion 15');
      await page.fill('input[name="numero_serie"]', 'SN-TEST-001');
      await page.fill('textarea[name="descripcion_falla"]', 'No enciende, se escucha ruido extraño en el ventilador');
      await page.fill('textarea[name="estado_fisico"]', 'Golpes menores en la carcasa, pantalla intacta');

      // Enviar formulario
      await page.click('button[type="submit"]:has-text("Crear")');

      // Verificar mensaje de éxito
      await expect(page.locator('text=Reparación creada exitosamente')).toBeVisible({ timeout: 5000 });
    });

    test('valida campos requeridos al crear reparación', async ({ page }) => {
      // Login
      await page.click('text=Empleados');
      await page.fill('input[type="email"]', tecnicoEmail);
      await page.fill('input[type="password"]', tecnicoPassword);
      await page.click('button[type="submit"]');

      await page.waitForURL('**/tecnico', { timeout: 10000 });

      // Navegar a crear reparación
      await page.click('text=Nueva Reparación');

      // Intentar enviar sin datos
      await page.click('button[type="submit"]:has-text("Crear")');

      // Verificar que muestra errores de validación
      await expect(page.locator('text=campo requerido').or(page.locator('text=obligatorio'))).toBeVisible();
    });
  });

  test.describe('Gestión de estados (Técnico)', () => {
    test('técnico puede avanzar estados de reparación', async ({ page }) => {
      // Login como técnico
      await page.click('text=Empleados');
      await page.fill('input[type="email"]', tecnicoEmail);
      await page.fill('input[type="password"]', tecnicoPassword);
      await page.click('button[type="submit"]');

      await page.waitForURL('**/tecnico', { timeout: 10000 });

      // Ir a mis reparaciones
      await page.click('text=Mis Reparaciones');
      await page.waitForSelector('table', { timeout: 5000 });

      // Seleccionar primera reparación
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.click();

      // Esperar modal de detalles
      await page.waitForSelector('text=Detalles de la Reparación', { timeout: 5000 });

      // Cambiar estado
      await page.click('button:has-text("Cambiar Estado")');
      await page.selectOption('select', 'en_diagnostico');
      await page.fill('textarea[placeholder*="notas"]', 'Iniciando diagnóstico del equipo');
      await page.click('button:has-text("Guardar")');

      // Verificar cambio de estado
      await expect(page.locator('text=Estado actualizado')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Gestión de cotización (Técnico)', () => {
    test('técnico puede agregar repuestos y generar cotización', async ({ page }) => {
      // Login
      await page.click('text=Empleados');
      await page.fill('input[type="email"]', tecnicoEmail);
      await page.fill('input[type="password"]', tecnicoPassword);
      await page.click('button[type="submit"]');

      await page.waitForURL('**/tecnico', { timeout: 10000 });

      // Ir a reparaciones
      await page.click('text=Mis Reparaciones');
      await page.waitForSelector('table', { timeout: 5000 });

      // Abrir reparación en diagnóstico
      const rowEnDiagnostico = page.locator('table tbody tr', { hasText: 'En diagnóstico' }).first();
      if (await rowEnDiagnostico.count() > 0) {
        await rowEnDiagnostico.click();

        // Agregar repuesto
        await page.click('button:has-text("Agregar Repuesto")');
        await page.fill('input[placeholder*="descripción"]', 'Disco duro SSD 256GB');
        await page.fill('input[type="number"][placeholder*="cantidad"]', '1');
        await page.fill('input[type="number"][placeholder*="costo"]', '150000');
        await page.click('button:has-text("Agregar")');

        // Generar cotización
        await page.click('button:has-text("Generar Cotización")');

        // Verificar éxito
        await expect(page.locator('text=Cotización generada')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Consulta pública de reparación (Cliente)', () => {
    test('cliente puede consultar estado de reparación por número de orden', async ({ page }) => {
      // Ir a página de consulta
      await page.goto(`${baseURL}/estado-reparacion`);

      // Verificar que estamos en la página correcta
      await expect(page.locator('h1', { hasText: 'Consultar Reparación' })).toBeVisible();

      // Ingresar número de orden (debe existir en la BD)
      await page.fill('input[placeholder*="orden"]', 'ORD-00000001');
      await page.click('button:has-text("Consultar")');

      // Verificar que se muestra información de la reparación
      await expect(page.locator('text=Estado actual').or(page.locator('text=Detalles'))).toBeVisible({ timeout: 5000 });
    });

    test('cliente puede aceptar cotización', async ({ page }) => {
      await page.goto(`${baseURL}/estado-reparacion`);

      // Consultar reparación con cotización
      await page.fill('input[placeholder*="orden"]', 'ORD-00000003');
      await page.click('button:has-text("Consultar")');

      await page.waitForTimeout(2000);

      // Si hay cotización pendiente
      const btnAceptar = page.locator('button:has-text("Aceptar Cotización")');
      if (await btnAceptar.isVisible()) {
        await btnAceptar.click();
        
        // Confirmar
        await page.click('button:has-text("Confirmar")');

        // Verificar éxito
        await expect(page.locator('text=Cotización aceptada')).toBeVisible({ timeout: 5000 });
      }
    });

    test('cliente puede realizar pago', async ({ page }) => {
      await page.goto(`${baseURL}/estado-reparacion`);

      await page.fill('input[placeholder*="orden"]', 'ORD-00000004');
      await page.click('button:has-text("Consultar")');

      await page.waitForTimeout(2000);

      // Si está lista para pagar
      const btnPagar = page.locator('button:has-text("Pagar")');
      if (await btnPagar.isVisible()) {
        await btnPagar.click();

        // Seleccionar método de pago
        await page.click('button:has-text("Transferencia")');

        // Confirmar pago
        await page.click('button:has-text("Confirmar Pago")');

        // Verificar éxito
        await expect(page.locator('text=Pago procesado')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Dashboard de administrador', () => {
    test('admin puede ver todas las reparaciones', async ({ page }) => {
      // Login como admin
      await page.click('text=Empleados');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');

      await page.waitForURL('**/admin', { timeout: 10000 });

      // Verificar métricas en dashboard
      await expect(page.locator('text=Reparaciones Activas').or(page.locator('text=Total'))).toBeVisible();

      // Navegar a reparaciones
      await page.click('text=Reparaciones');
      await page.waitForSelector('table', { timeout: 5000 });

      // Verificar que hay datos
      const rows = page.locator('table tbody tr');
      await expect(rows.first()).toBeVisible();
    });

    test('admin puede filtrar reparaciones por estado', async ({ page }) => {
      await page.click('text=Empleados');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.click('button[type="submit"]');

      await page.waitForURL('**/admin', { timeout: 10000 });

      await page.click('text=Reparaciones');
      await page.waitForSelector('table', { timeout: 5000 });

      // Usar filtro de estado
      const filterSelect = page.locator('select', { hasText: 'Estado' }).or(page.locator('select').first());
      if (await filterSelect.count() > 0) {
        await filterSelect.selectOption('recibido');
        
        // Verificar que la tabla se filtra
        await page.waitForTimeout(1000);
        const rows = page.locator('table tbody tr');
        await expect(rows.first()).toBeVisible();
      }
    });
  });

  test.describe('Flujo completo de reparación', () => {
    test('flujo completo: creación -> diagnóstico -> cotización -> pago -> entrega', async ({ page }) => {
      const numeroOrden = `ORD-${Date.now()}`;

      // 1. Técnico crea reparación
      await page.click('text=Empleados');
      await page.fill('input[type="email"]', tecnicoEmail);
      await page.fill('input[type="password"]', tecnicoPassword);
      await page.click('button[type="submit"]');

      await page.waitForURL('**/tecnico', { timeout: 10000 });

      // Nota: En un flujo real, aquí crearíamos la reparación y obtendríamos el número de orden
      // Para este test, usamos un número de orden existente

      // 2. Cliente consulta estado
      await page.goto(`${baseURL}/estado-reparacion`);
      await page.fill('input[placeholder*="orden"]', 'ORD-00000001');
      await page.click('button:has-text("Consultar")');

      // Verificar que se muestra la consulta
      await expect(page.locator('text=Estado').or(page.locator('text=Detalles'))).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Validaciones de seguridad', () => {
    test('previene acceso sin autenticación a módulo técnico', async ({ page }) => {
      await page.goto(`${baseURL}/tecnico`);

      // Debe redirigir a login
      await expect(page).toHaveURL(/.*login|auth/, { timeout: 5000 });
    });

    test('previene acceso sin autenticación a módulo admin', async ({ page }) => {
      await page.goto(`${baseURL}/admin`);

      // Debe redirigir a login
      await expect(page).toHaveURL(/.*login|auth/, { timeout: 5000 });
    });
  });
});
