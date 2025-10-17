import { test, expect } from '@playwright/test';

test.describe('Autenticación E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debe mostrar la página de login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill('invalido@test.com');
    await page.getByLabel(/contraseña/i).fill('ContraseñaIncorrecta123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar mensaje de error
    await expect(page.getByText(/error/i)).toBeVisible({ timeout: 5000 });
  });

  test('debe permitir mostrar/ocultar contraseña', async ({ page }) => {
    const passwordInput = page.getByLabel(/contraseña/i);
    const toggleButton = page.getByRole('button', { name: /mostrar contraseña/i });
    
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Los campos vacíos deben tener validación HTML5
    const emailInput = page.getByLabel(/correo electrónico/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('debe deshabilitar botón mientras carga', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill('test@test.com');
    await page.getByLabel(/contraseña/i).fill('Test123456');
    
    const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
    await submitButton.click();
    
    // El botón debe estar deshabilitado inmediatamente después del click
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Navegación después de login', () => {
  test('debe redirigir a dashboard después de login exitoso', async ({ page }) => {
    // Este test requeriría credenciales reales o un usuario de prueba
    // Por ahora es un placeholder para la estructura
    test.skip();
  });

  test('debe mantener sesión después de refrescar', async ({ page }) => {
    // Este test verificaría persistencia de sesión
    test.skip();
  });

  test('debe cerrar sesión correctamente', async ({ page }) => {
    // Este test verificaría el flujo de logout
    test.skip();
  });
});
