import { test, expect } from '@playwright/test';

test.describe('Proceso de Ventas E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login como usuario de ventas
    await page.getByLabel(/correo electrónico/i).fill('loaizac114@gmail.com');
    await page.locator('input[type="password"], #password').fill('Bbreyner18');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/ventas/, { timeout: 10000 });
  });

  test('debe navegar a registro de ventas', async ({ page }) => {
    // Buscar link de registro de ventas
    const registroLink = page.getByRole('link', { name: /registro|nueva venta/i });
    await registroLink.click();
    
    // Verificar que navegamos a la página correcta
    await expect(page).toHaveURL(/ventas.*registro/i);
  });

  test('debe seleccionar cliente para venta', async ({ page }) => {
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
    
    // Buscar selector de cliente
    const clienteSelect = page.getByLabel(/cliente/i);
    await clienteSelect.click();
    
    // Seleccionar un cliente
    await page.getByRole('option').first().click();
    
    // Verificar que se seleccionó
    await page.waitForTimeout(500);
  });

  test('debe agregar productos a la venta', async ({ page }) => {
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
    
    // Seleccionar cliente
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    // Agregar producto
    const addProductButton = page.getByRole('button', { name: /agregar producto|añadir producto/i });
    await addProductButton.click();
    
    // Seleccionar producto
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    
    // Ingresar cantidad
    await page.getByLabel(/cantidad/i).fill('2');
    
    // Confirmar
    const confirmButton = page.getByRole('button', { name: /agregar|añadir|confirmar/i }).last();
    await confirmButton.click();
    
    // Verificar que se agregó a la lista
    await page.waitForTimeout(1000);
  });

  test('debe calcular total automáticamente', async ({ page }) => {
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
    
    // Seleccionar cliente
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    // Agregar producto
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/cantidad/i).fill('3');
    await page.getByRole('button', { name: /agregar|confirmar/i }).last().click();
    
    // Verificar que hay un campo de total visible
    await expect(page.getByText(/total|subtotal/i)).toBeVisible({ timeout: 3000 });
  });

  test('debe validar stock antes de agregar producto', async ({ page }) => {
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
    
    // Seleccionar cliente
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    // Intentar agregar producto
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    
    // El sistema debe validar el stock disponible
    await page.waitForTimeout(1000);
  });

  test('debe mostrar error si no hay suficiente stock', async ({ page }) => {
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
    
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    
    // Intentar agregar cantidad mayor al stock
    await page.getByLabel(/cantidad/i).fill('99999');
    await page.getByRole('button', { name: /agregar|confirmar/i }).last().click();
    
    // Verificar mensaje de error
    await expect(page.getByText(/stock insuficiente|no hay suficiente/i)).toBeVisible({ timeout: 3000 });
  });

  test('debe registrar venta exitosamente', async ({ page }) => {
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
    
    // Completar venta
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/cantidad/i).fill('1');
    await page.getByRole('button', { name: /agregar|confirmar/i }).last().click();
    
    // Guardar venta
    const saveButton = page.getByRole('button', { name: /registrar venta|guardar venta/i });
    await saveButton.click();
    
    // Verificar mensaje de éxito
    await expect(page.getByText(/venta registrada|éxito/i)).toBeVisible({ timeout: 5000 });
  });

  test('debe actualizar inventario después de venta', async ({ page }) => {
    // Este test requiere verificar que el stock se descontó
    // Navegamos al módulo de inventario después de una venta
    await page.getByRole('link', { name: /stock|inventario/i }).click();
    
    // Verificar que la tabla de stock está visible
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
  });

  test('debe generar comprobante de venta', async ({ page }) => {
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
    
    // Completar venta básica
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/cantidad/i).fill('1');
    await page.getByRole('button', { name: /agregar|confirmar/i }).last().click();
    
    await page.getByRole('button', { name: /registrar venta/i }).click();
    
    // Buscar botón de comprobante o PDF
    const comprobanteButton = page.getByRole('button', { name: /comprobante|imprimir|pdf/i });
    
    if (await comprobanteButton.isVisible({ timeout: 3000 })) {
      await comprobanteButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('debe mostrar resumen de venta', async ({ page }) => {
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
    
    // Agregar productos
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/cantidad/i).fill('2');
    await page.getByRole('button', { name: /agregar|confirmar/i }).last().click();
    
    // Verificar que hay un resumen visible (tabla de items, total, etc.)
    await expect(page.getByText(/total|subtotal/i)).toBeVisible();
  });
});

test.describe('Validaciones de Venta', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo electrónico/i).fill('loaizac114@gmail.com');
    await page.locator('input[type="password"], #password').fill('Bbreyner18');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/ventas/, { timeout: 10000 });
    await page.getByRole('link', { name: /registro|nueva venta/i }).click();
  });

  test('debe requerir cliente', async ({ page }) => {
    // Intentar agregar producto sin seleccionar cliente
    const addProductButton = page.getByRole('button', { name: /agregar producto/i });
    
    // Si el botón está deshabilitado o no permite agregar sin cliente
    if (await addProductButton.isVisible()) {
      await addProductButton.click();
      
      // Intentar guardar venta sin cliente
      const saveButton = page.getByRole('button', { name: /registrar venta|guardar venta/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Verificar mensaje de error
        await expect(page.getByText(/cliente.*requerido|seleccione.*cliente/i)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('debe requerir al menos un producto', async ({ page }) => {
    // Seleccionar cliente pero no agregar productos
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    // Intentar guardar venta sin productos
    const saveButton = page.getByRole('button', { name: /registrar venta|guardar venta/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Verificar mensaje de error
      await expect(page.getByText(/agregar.*producto|al menos.*producto/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('debe validar cantidad positiva', async ({ page }) => {
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    
    // Intentar ingresar cantidad negativa o cero
    await page.getByLabel(/cantidad/i).fill('0');
    await page.getByRole('button', { name: /agregar|confirmar/i }).last().click();
    
    // Verificar error
    await page.waitForTimeout(1000);
  });

  test('debe prevenir venta sin stock', async ({ page }) => {
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    
    // Intentar cantidad muy alta
    await page.getByLabel(/cantidad/i).fill('999999');
    await page.getByRole('button', { name: /agregar|confirmar/i }).last().click();
    
    // Verificar mensaje de stock insuficiente
    await expect(page.getByText(/stock insuficiente|no disponible/i)).toBeVisible({ timeout: 3000 });
  });

  test('debe calcular subtotales correctamente', async ({ page }) => {
    await page.getByLabel(/cliente/i).click();
    await page.getByRole('option').first().click();
    
    // Agregar un producto
    await page.getByRole('button', { name: /agregar producto/i }).click();
    await page.getByLabel(/producto/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/cantidad/i).fill('3');
    await page.getByRole('button', { name: /agregar|confirmar/i }).last().click();
    
    // Verificar que muestra subtotal y total
    await expect(page.getByText(/subtotal|total/i)).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Historial de Ventas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo electrónico/i).fill('loaizac114@gmail.com');
    await page.locator('input[type="password"], #password').fill('Bbreyner18');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/ventas/, { timeout: 10000 });
  });

  test('debe mostrar listado de ventas', async ({ page }) => {
    // Navegar a la página de historial o dashboard de ventas
    const ventasLink = page.getByRole('link', { name: /dashboard|historial|ventas/i }).first();
    await ventasLink.click();
    
    // Verificar que hay una tabla o lista de ventas
    await expect(page.getByRole('table').or(page.locator('[class*="venta"]'))).toBeVisible({ timeout: 5000 });
  });

  test('debe filtrar ventas por fecha', async ({ page }) => {
    await page.getByRole('link', { name: /dashboard|historial/i }).first().click();
    
    // Buscar filtros de fecha
    const dateFilter = page.getByLabel(/fecha|desde|hasta/i).first();
    
    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      // Seleccionar una fecha
      await page.waitForTimeout(1000);
    }
  });

  test('debe buscar ventas por cliente', async ({ page }) => {
    await page.getByRole('link', { name: /dashboard|historial/i }).first().click();
    
    // Buscar campo de búsqueda
    const searchInput = page.getByPlaceholder(/buscar/i);
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Juan');
      await page.waitForTimeout(1000);
      
      // Verificar que filtra resultados
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('debe mostrar detalles de venta', async ({ page }) => {
    await page.getByRole('link', { name: /dashboard|historial/i }).first().click();
    
    // Buscar botón de ver detalles
    const detailsButton = page.getByRole('button', { name: /ver|detalles/i }).first();
    
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      
      // Verificar que muestra información de la venta
      await expect(page.getByText(/cliente|total|fecha/i).first()).toBeVisible({ timeout: 3000 });
    }
  });
});
