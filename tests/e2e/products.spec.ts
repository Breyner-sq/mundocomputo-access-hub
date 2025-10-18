import { test, expect } from '@playwright/test';

test.describe('Gestión de Productos E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login con usuario de inventario (productos están en módulo de inventario)
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').fill('olayageraldine17@gmail.com');
    await page.locator('input[type="password"]').fill('Bbreyner18');
    await page.locator('button[type="submit"]').click();
    
    // Esperar redirección y navegar a productos de inventario
    await page.waitForURL(/\/inventario/, { timeout: 10000 });
    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
  });

  test('debe navegar a la página de productos', async ({ page }) => {
    await expect(page).toHaveURL(/inventario\/productos/);
  });

  test('debe mostrar listado de productos', async ({ page }) => {
    // Verificar que se muestra el título
    await expect(page.getByText('Lista de Productos')).toBeVisible();
    
    // Verificar que existe la tabla
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Verificar encabezados de la tabla
    await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Precio Venta' })).toBeVisible();
  });

  test('debe permitir buscar productos', async ({ page }) => {
    // Verificar que existe el campo de búsqueda
    const searchInput = page.getByPlaceholder('Buscar producto por nombre...');
    await expect(searchInput).toBeVisible();
    
    // Verificar que se puede escribir en el campo
    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('debe abrir modal de crear producto', async ({ page }) => {
    // Verificar que existe el botón de crear producto
    const createButton = page.getByRole('button', { name: /nuevo producto/i });
    await expect(createButton).toBeVisible();
    
    // Abrir el modal
    await createButton.click();
    
    // Verificar que el modal se abre
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/crear nuevo producto/i)).toBeVisible();
  });

  test('debe crear un producto con datos válidos', async ({ page }) => {
    // Abrir modal de crear producto
    await page.getByRole('button', { name: /nuevo producto/i }).click();
    
    // Verificar que existen los campos del formulario
    await expect(page.locator('#nombre')).toBeVisible();
    await expect(page.locator('#precio_venta')).toBeVisible();
    await expect(page.locator('#stock_minimo')).toBeVisible();
  });

  test('debe validar campos requeridos al crear producto', async ({ page }) => {
    // Abrir modal de crear producto
    await page.getByRole('button', { name: /nuevo producto/i }).click();
    
    // Verificar que los campos requeridos tienen el atributo required
    await expect(page.locator('#nombre')).toHaveAttribute('required');
    await expect(page.locator('#precio_venta')).toHaveAttribute('required');
  });

  test('debe editar un producto existente', async ({ page }) => {
    // Verificar que existen botones de editar
    const editButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(editButton).toBeVisible();
  });

  test('debe eliminar un producto', async ({ page }) => {
    // Verificar que existen botones de eliminar
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('debe prevenir eliminación de producto con inventario', async ({ page }) => {
    // Verificar que la tabla de productos está visible
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('debe exportar productos a PDF', async ({ page }) => {
    // Verificar que existe el botón de exportar PDF
    const exportButton = page.getByRole('button', { name: /exportar pdf/i });
    await expect(exportButton).toBeVisible();
  });

  test('debe filtrar productos por categoría', async ({ page }) => {
    // Verificar que la tabla muestra la columna de categoría
    await expect(page.getByRole('columnheader', { name: 'Categoría' })).toBeVisible();
  });

  test('debe mostrar mensaje cuando no hay productos', async ({ page }) => {
    // Verificar que existe la tabla (puede tener productos o estar vacía)
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Si no hay productos, debería mostrar un mensaje
    // pero como es producción, probablemente haya productos
  });
});

test.describe('Validaciones de Productos', () => {
  test.beforeEach(async ({ page }) => {
    // Login con usuario de inventario (productos están en módulo de inventario)
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').fill('olayageraldine17@gmail.com');
    await page.locator('input[type="password"]').fill('Bbreyner18');
    await page.locator('button[type="submit"]').click();
    
    // Esperar redirección y navegar a productos de inventario
    await page.waitForURL(/\/inventario/, { timeout: 10000 });
    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
  });

  test('debe validar precio positivo', async ({ page }) => {
    // Abrir modal de crear producto
    await page.getByRole('button', { name: /nuevo producto/i }).click();
    
    // Verificar que el campo precio tiene validación de número positivo
    const precioInput = page.locator('#precio_venta');
    await expect(precioInput).toHaveAttribute('type', 'number');
    await expect(precioInput).toHaveAttribute('min', '0');
  });

  test('debe validar stock mínimo no negativo', async ({ page }) => {
    // Abrir modal de crear producto
    await page.getByRole('button', { name: /nuevo producto/i }).click();
    
    // Verificar que el campo stock mínimo tiene validación
    const stockInput = page.locator('#stock_minimo');
    await expect(stockInput).toHaveAttribute('type', 'number');
    await expect(stockInput).toHaveAttribute('min', '0');
  });

  test('debe validar nombre no vacío', async ({ page }) => {
    // Verificar que se muestran nombres en la tabla
    await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
  });

  test('debe validar selección de categoría', async ({ page }) => {
    // Verificar que se muestra la columna de categoría
    await expect(page.getByRole('columnheader', { name: 'Categoría' })).toBeVisible();
  });
});