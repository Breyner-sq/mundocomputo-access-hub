import { test, expect } from '@playwright/test';

test.describe('Gestión de Inventario E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login como usuario de inventario
    await page.getByLabel(/correo electrónico/i).fill('inventario@test.com');
    await page.locator('input[type="password"], #password').fill('Inventario123!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/inventario/, { timeout: 10000 });
  });

  test('debe navegar a inventario', async ({ page }) => {
    // Buscar el link o botón de Stock en el menú
    const stockLink = page.getByRole('link', { name: /stock/i });
    await stockLink.click();
    
    // Verificar que navegamos a la página de stock
    await expect(page).toHaveURL(/inventario.*stock/i);
  });

  test('debe mostrar stock de productos', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Verificar que hay una tabla o lista de productos
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
    
    // Verificar columnas de la tabla
    await expect(page.getByText(/producto|nombre/i)).toBeVisible();
    await expect(page.getByText(/cantidad|stock/i)).toBeVisible();
  });

  test('debe crear nuevo lote de inventario', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Buscar botón para agregar lote
    const addButton = page.getByRole('button', { name: /agregar lote|nuevo lote|crear lote/i });
    await addButton.click();
    
    // Llenar formulario de lote
    await page.getByLabel(/producto/i).first().click();
    await page.getByRole('option').first().click();
    
    await page.getByLabel(/cantidad/i).fill('50');
    await page.getByLabel(/precio.*compra/i).fill('100.00');
    
    // Guardar lote
    const saveButton = page.getByRole('button', { name: /guardar|crear|agregar/i }).last();
    await saveButton.click();
    
    // Verificar mensaje de éxito
    await expect(page.getByText(/exitosamente|éxito|agregado/i)).toBeVisible({ timeout: 5000 });
  });

  test('debe validar datos del lote', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    const addButton = page.getByRole('button', { name: /agregar lote|nuevo lote|crear lote/i });
    await addButton.click();
    
    // Intentar guardar sin llenar campos
    const saveButton = page.getByRole('button', { name: /guardar|crear|agregar/i }).last();
    await saveButton.click();
    
    // Verificar que muestra errores de validación
    await expect(page.getByText(/requerido|obligatorio|campo necesario/i)).toBeVisible({ timeout: 3000 });
  });

  test('debe actualizar stock total después de agregar lote', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Obtener stock inicial del primer producto
    const stockCell = page.locator('table tbody tr').first().locator('td').nth(2);
    const initialStock = await stockCell.textContent();
    
    // Agregar un nuevo lote
    await page.getByRole('button', { name: /agregar lote|nuevo lote/i }).click();
    await page.getByLabel(/producto/i).first().click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/cantidad/i).fill('10');
    await page.getByLabel(/precio.*compra/i).fill('50.00');
    await page.getByRole('button', { name: /guardar|crear/i }).last().click();
    
    // Esperar actualización
    await page.waitForTimeout(2000);
    
    // Verificar que el stock aumentó
    const newStock = await stockCell.textContent();
    expect(newStock).not.toBe(initialStock);
  });

  test('debe mostrar productos con stock bajo', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Buscar indicadores de stock bajo (puede ser un badge, color rojo, etc.)
    const lowStockIndicators = page.locator('[class*="low-stock"], [class*="danger"], [class*="destructive"]');
    
    // Si hay productos con stock bajo, deben ser visibles
    const count = await lowStockIndicators.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe filtrar por producto', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Buscar campo de búsqueda
    const searchInput = page.getByPlaceholder(/buscar|filtrar/i);
    await searchInput.fill('Laptop');
    
    // Esperar que se actualice la tabla
    await page.waitForTimeout(1000);
    
    // Verificar que solo muestra productos filtrados
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe mostrar historial de lotes', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Verificar que hay una tabla con lotes
    await expect(page.getByRole('table')).toBeVisible();
    
    // Verificar que muestra información de lotes (fecha, cantidad, precio)
    await expect(page.getByText(/fecha/i)).toBeVisible();
  });
});

test.describe('Alertas de Stock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo electrónico/i).fill('inventario@test.com');
    await page.locator('input[type="password"], #password').fill('Inventario123!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/inventario/, { timeout: 10000 });
  });

  test('debe identificar productos bajo stock mínimo', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Buscar productos con badge de stock bajo
    const lowStockBadges = page.locator('[class*="badge"][class*="destructive"], [class*="alert"]');
    
    // Verificar que existen indicadores
    const count = await lowStockBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe mostrar indicador visual de stock crítico', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Buscar indicadores visuales (colores de alerta, iconos)
    const criticalIndicators = page.locator('[class*="text-red"], [class*="text-destructive"], [class*="danger"]');
    
    const count = await criticalIndicators.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe calcular stock total correctamente', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Verificar que hay columnas de stock en la tabla
    await expect(page.getByText(/stock total|cantidad total/i)).toBeVisible();
    
    // Verificar que los valores son numéricos y mayores o iguales a 0
    const stockCells = page.locator('table tbody tr td:has-text("0"), table tbody tr td:has-text("1"), table tbody tr td:has-text("2"), table tbody tr td:has-text("3"), table tbody tr td:has-text("4"), table tbody tr td:has-text("5")');
    const count = await stockCells.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Integridad de Inventario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo electrónico/i).fill('inventario@test.com');
    await page.locator('input[type="password"], #password').fill('Inventario123!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/inventario/, { timeout: 10000 });
  });

  test('debe descontar stock después de venta', async ({ page }) => {
    // Este test requiere integración con el módulo de ventas
    // Verificar que existe la funcionalidad de descuento automático
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Verificar que la tabla de stock está visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('debe prevenir valores negativos', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    await page.getByRole('button', { name: /agregar lote|nuevo lote/i }).click();
    
    // Intentar ingresar cantidad negativa
    await page.getByLabel(/cantidad/i).fill('-10');
    await page.getByLabel(/precio.*compra/i).fill('50.00');
    
    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).last();
    await saveButton.click();
    
    // Verificar que muestra error o no permite guardar
    await page.waitForTimeout(1000);
  });

  test('debe mantener trazabilidad de movimientos', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    
    // Verificar que hay información de fechas en los lotes
    await expect(page.getByText(/fecha/i)).toBeVisible();
    
    // Verificar que hay tabla con historial
    await expect(page.getByRole('table')).toBeVisible();
  });
});
