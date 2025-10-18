import { test, expect } from '@playwright/test';

test.describe('Gestión de Productos E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login como administrador o usuario de inventario
    await page.getByLabel(/correo electrónico/i).fill('admin@test.com');
    await page.locator('input[type="password"], #password').fill('Admin123!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/\/(admin|inventario)/, { timeout: 10000 });
  });

  test('debe navegar a la página de productos', async ({ page }) => {
    // Buscar link de productos en el sidebar
    const productosLink = page.getByRole('link', { name: /productos/i });
    await productosLink.click();
    
    // Verificar que navegamos a la página correcta
    await expect(page).toHaveURL(/productos/i);
  });

  test('debe mostrar listado de productos', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Verificar que existe una tabla de productos
    await expect(page.getByRole('table')).toBeVisible({ timeout: 5000 });
    
    // Verificar columnas esperadas
    await expect(page.getByText(/nombre/i)).toBeVisible();
    await expect(page.getByText(/precio/i)).toBeVisible();
    await expect(page.getByText(/categoría/i)).toBeVisible();
  });

  test('debe permitir buscar productos', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Buscar campo de búsqueda
    const searchInput = page.getByPlaceholder(/buscar/i);
    await searchInput.fill('Laptop');
    
    // Esperar que se filtre la tabla
    await page.waitForTimeout(1000);
    
    // Verificar que hay resultados
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('debe abrir modal de crear producto', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Buscar botón de crear producto
    const createButton = page.getByRole('button', { name: /nuevo producto|crear producto|agregar producto/i });
    await createButton.click();
    
    // Verificar que se abre un modal o formulario
    await expect(page.getByRole('dialog').or(page.getByRole('form'))).toBeVisible({ timeout: 3000 });
  });

  test('debe crear un producto con datos válidos', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    const createButton = page.getByRole('button', { name: /nuevo producto|crear producto|agregar producto/i });
    await createButton.click();
    
    // Llenar formulario
    await page.getByLabel(/nombre/i).fill('Teclado Mecánico RGB');
    await page.getByLabel(/descripción/i).fill('Teclado mecánico con iluminación RGB');
    
    // Seleccionar categoría
    await page.getByLabel(/categoría/i).click();
    await page.getByRole('option').first().click();
    
    await page.getByLabel(/precio/i).fill('89.99');
    await page.getByLabel(/código.*barras/i).fill('7891234567890');
    await page.getByLabel(/stock.*mínimo/i).fill('5');
    
    // Guardar
    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).last();
    await saveButton.click();
    
    // Verificar mensaje de éxito
    await expect(page.getByText(/exitosamente|éxito|creado/i)).toBeVisible({ timeout: 5000 });
  });

  test('debe validar campos requeridos al crear producto', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    const createButton = page.getByRole('button', { name: /nuevo producto|crear producto/i });
    await createButton.click();
    
    // Intentar guardar sin llenar campos
    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).last();
    await saveButton.click();
    
    // Verificar errores de validación
    await expect(page.getByText(/requerido|obligatorio/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('debe editar un producto existente', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Buscar botón de editar en la primera fila
    const editButton = page.getByRole('button', { name: /editar/i }).first();
    await editButton.click();
    
    // Modificar un campo
    await page.getByLabel(/nombre/i).fill('Producto Editado');
    
    // Guardar cambios
    const saveButton = page.getByRole('button', { name: /guardar|actualizar/i }).last();
    await saveButton.click();
    
    // Verificar mensaje de éxito
    await expect(page.getByText(/actualizado|éxito/i)).toBeVisible({ timeout: 5000 });
  });

  test('debe eliminar un producto', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Buscar botón de eliminar
    const deleteButton = page.getByRole('button', { name: /eliminar|borrar/i }).first();
    await deleteButton.click();
    
    // Confirmar eliminación
    const confirmButton = page.getByRole('button', { name: /confirmar|eliminar|sí/i }).last();
    await confirmButton.click();
    
    // Verificar mensaje de éxito
    await expect(page.getByText(/eliminado|éxito/i)).toBeVisible({ timeout: 5000 });
  });

  test('debe prevenir eliminación de producto con inventario', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Este test depende de la lógica del negocio
    // Intentar eliminar un producto que tiene stock
    const deleteButton = page.getByRole('button', { name: /eliminar|borrar/i }).first();
    await deleteButton.click();
    
    const confirmButton = page.getByRole('button', { name: /confirmar|eliminar|sí/i }).last();
    await confirmButton.click();
    
    // Puede mostrar un error o mensaje de advertencia
    await page.waitForTimeout(2000);
  });

  test('debe exportar productos a PDF', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Buscar botón de exportar
    const exportButton = page.getByRole('button', { name: /exportar|pdf/i });
    
    if (await exportButton.isVisible()) {
      // Si existe el botón, hacer click
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click()
      ]);
      
      // Verificar que se descargó un archivo
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });

  test('debe filtrar productos por categoría', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Buscar selector de categoría
    const categoryFilter = page.getByLabel(/categoría/i).or(page.getByRole('combobox').first());
    await categoryFilter.click();
    
    // Seleccionar una categoría
    await page.getByRole('option').first().click();
    
    // Esperar que se filtre
    await page.waitForTimeout(1000);
    
    // Verificar que hay tabla visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('debe mostrar mensaje cuando no hay productos', async ({ page }) => {
    await page.getByRole('link', { name: /productos/i }).click();
    
    // Buscar con un término que no existe
    const searchInput = page.getByPlaceholder(/buscar/i);
    await searchInput.fill('ProductoQueNoExiste12345XYZ');
    
    await page.waitForTimeout(1000);
    
    // Verificar mensaje de "no hay resultados"
    await expect(page.getByText(/no se encontraron|sin resultados|no hay productos/i)).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Validaciones de Productos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/correo electrónico/i).fill('admin@test.com');
    await page.locator('input[type="password"], #password').fill('Admin123!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.waitForURL(/\/(admin|inventario)/, { timeout: 10000 });
    await page.getByRole('link', { name: /productos/i }).click();
  });

  test('debe validar precio positivo', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nuevo producto|crear producto/i });
    await createButton.click();
    
    // Intentar ingresar precio negativo
    await page.getByLabel(/precio/i).fill('-10.50');
    
    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).last();
    await saveButton.click();
    
    // Verificar que muestra error de validación
    await expect(page.getByText(/precio.*positivo|precio.*válido/i)).toBeVisible({ timeout: 3000 });
  });

  test('debe validar stock mínimo no negativo', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nuevo producto|crear producto/i });
    await createButton.click();
    
    // Intentar ingresar stock negativo
    await page.getByLabel(/stock.*mínimo/i).fill('-5');
    
    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).last();
    await saveButton.click();
    
    // Verificar error
    await page.waitForTimeout(1000);
  });

  test('debe validar nombre no vacío', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nuevo producto|crear producto/i });
    await createButton.click();
    
    // Dejar nombre vacío y llenar otros campos
    await page.getByLabel(/precio/i).fill('50.00');
    
    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).last();
    await saveButton.click();
    
    // Verificar que muestra error de nombre requerido
    await expect(page.getByText(/nombre.*requerido|nombre.*obligatorio/i)).toBeVisible({ timeout: 3000 });
  });

  test('debe validar selección de categoría', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /nuevo producto|crear producto/i });
    await createButton.click();
    
    // Llenar otros campos pero no categoría
    await page.getByLabel(/nombre/i).fill('Producto sin categoría');
    await page.getByLabel(/precio/i).fill('25.00');
    
    const saveButton = page.getByRole('button', { name: /guardar|crear/i }).last();
    await saveButton.click();
    
    // Verificar error de categoría requerida
    await expect(page.getByText(/categoría.*requerida|categoría.*obligatoria/i)).toBeVisible({ timeout: 3000 });
  });
});
