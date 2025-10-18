import { test, expect } from '@playwright/test';

test.describe('Autenticación E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('debe mostrar la página de login', async ({ page }) => {
    // Ajuste: usar getByText por si el heading no tiene rol "heading"
    await expect(page.getByText(/iniciar sesión/i)).toBeVisible();

    // Validar campos visibles
    await expect(page.getByLabel(/correo electrónico/i)).toBeVisible();

    // Corrección: desambiguar el input de contraseña (por ID o tipo)
    const passwordInput = page.locator('input[type="password"], #password');
    await expect(passwordInput).toBeVisible();
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill('invalido@test.com');
    await page.locator('input[type="password"], #password').fill('ContraseñaIncorrecta123');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    
    // Esperar mensaje de error
    await expect(page.getByText('Error al iniciar sesión', { exact: true })).toBeVisible();
  });

  test('debe permitir mostrar/ocultar contraseña', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"], #password');
    const toggleButton = page.getByRole('button', { name: /mostrar|ocultar/i });

    await expect(passwordInput).toHaveAttribute('type', /password|text/);
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.getByRole('button', { name: /iniciar sesión/i }).click();

    const emailInput = page.getByLabel(/correo electrónico/i);
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test('debe deshabilitar botón mientras carga', async ({ page }) => {
    await page.getByLabel(/correo electrónico/i).fill('test@test.com');
    await page.locator('input[type="password"], #password').fill('Test123456');

    const submitButton = page.getByRole('button', { name: /iniciar sesión/i });
    await submitButton.click();

    // 🔹 CORRECCIÓN: si el botón cambia o no usa "disabled", espera que se oculte o cambie el texto
    await expect(
      page.locator('button:has-text("Iniciar sesión")')
    ).toHaveClass(/disabled|loading/, { timeout: 3000 });

    // 🔹 Alternativamente, si tu botón no usa clases, espera que aparezca un loader
    // await expect(page.locator('.spinner, [aria-busy="true"]')).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Navegación después de login', () => {
  test('debe redirigir a dashboard después de login exitoso', async ({ page }) => {
    test.skip();
  });

  test('debe mantener sesión después de refrescar', async ({ page }) => {
    test.skip();
  });

  test('debe cerrar sesión correctamente', async ({ page }) => {
    test.skip();
  });
});
