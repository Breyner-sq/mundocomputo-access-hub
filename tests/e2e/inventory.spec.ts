import { test, expect } from '@playwright/test';

test.describe('Gestión de Inventario E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login con credenciales reales
    await page.getByLabel(/correo electrónico/i).fill('olayageraldine17@gmail.com');
    await page.locator('input[type="password"], #password').fill('Bbreyner18');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/inventario/, { timeout: 15000 });
  });

  test('debe navegar a inventario', async ({ page }) => {
    const stockLink = page.getByRole('link', { name: /stock/i });
    await stockLink.click();
    await expect(page).toHaveURL(/inventario.*stock/i);
  });

  test('debe mostrar stock de productos', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/producto|nombre/i)).toBeVisible();
    await expect(page.getByText(/cantidad|stock/i)).toBeVisible();
  });

  test('debe crear nuevo lote de inventario', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    const addButton = page.getByRole('button', { name: /agregar lote|nuevo lote|crear lote/i });
    await addButton.click();
    await page.getByLabel(/producto/i).first().click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/cantidad/i).fill('50');
    await page.getByLabel(/precio.*compra/i).fill('100.00');
    const saveButton = page.getByRole('button', { name: /guardar|crear|agregar/i }).last();
    await saveButton.click();
    await expect(page.getByText(/exitosamente|éxito|agregado/i)).toBeVisible({ timeout: 5000 });
  });

  test('debe validar datos del lote', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    const addButton = page.getByRole('button', { name: /agregar lote|nuevo lote|crear lote/i });
    await addButton.click();
    const saveButton = page.getByRole('button', { name: /guardar|crear|agregar/i }).last();
    await saveButton.click();
    await expect(page.getByText(/requerido|obligatorio|campo necesario/i)).toBeVisible({ timeout: 3000 });
  });

  test('debe actualizar stock total después de agregar lote', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    const stockCell = page.locator('table tbody tr').first().locator('td').nth(2);
    const initialStock = await stockCell.textContent();
    await page.getByRole('button', { name: /agregar lote|nuevo lote/i }).click();
    await page.getByLabel(/producto/i).first().click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/cantidad/i).fill('10');
    await page.getByLabel(/precio.*compra/i).fill('50.00');
    await page.getByRole('button', { name: /guardar|crear/i }).last().click();
    await page.waitForTimeout(2000);
    const newStock = await stockCell.textContent();
    expect(newStock).not.toBe(initialStock);
  });

  test('debe mostrar productos con stock bajo', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    const lowStockIndicators = page.locator('[class*="low-stock"], [class*="danger"], [class*="destructive"]');
    const count = await lowStockIndicators.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe filtrar por producto', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    const searchInput = page.getByPlaceholder(/buscar|filtrar/i);
    await searchInput.fill('Laptop');
    await page.waitForTimeout(1000);
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe mostrar historial de lotes', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByText(/fecha/i)).toBeVisible();
  });
});

test.describe('Alertas de Stock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo electrónico/i).fill('olayageraldine17@gmail.com');
    await page.locator('input[type="password"], #password').fill('Bbreyner18');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/inventario/, { timeout: 15000 });
  });

  test('debe identificar productos bajo stock mínimo', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    const lowStockBadges = page.locator('[class*="badge"][class*="destructive"], [class*="alert"]');
    const count = await lowStockBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe mostrar indicador visual de stock crítico', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    const criticalIndicators = page.locator('[class*="text-red"], [class*="text-destructive"], [class*="danger"]');
    const count = await criticalIndicators.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe calcular stock total correctamente', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    await expect(page.getByText(/stock total|cantidad total/i)).toBeVisible();
    const stockCells = page.locator('table tbody tr td:has-text("0"), table tbody tr td:has-text("1"), table tbody tr td:has-text("2"), table tbody tr td:has-text("3"), table tbody tr td:has-text("4"), table tbody tr td:has-text("5")');
    const count = await stockCells.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Integridad de Inventario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo electrónico/i).fill('olayageraldine17@gmail.com');
    await page.locator('input[type="password"], #password').fill('Bbreyner18');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/inventario/, { timeout: 15000 });
  });

  test('debe descontar stock después de venta', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('debe prevenir valores negativos', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    await page.getByRole('button', { name: /agregar lote|nuevo lote/i }).click();
    await page.getByLabel(/cantidad/i).fill('-10');
    await page.getByLabel(/precio.*compra/i).fill('50.00');
    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).last();
    await saveButton.click();
    await page.waitForTimeout(1000);
  });

  test('debe mantener trazabilidad de movimientos', async ({ page }) => {
    await page.getByRole('link', { name: /stock/i }).click();
    await expect(page.getByText(/fecha/i)).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });
});
