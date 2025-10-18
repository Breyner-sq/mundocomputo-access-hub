import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Auth from '@/pages/Auth';

const mockSignIn = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Auth - Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario de login', () => {
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña', { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('permite ingresar credenciales válidas', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText('Contraseña', { selector: 'input' });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'Admin123!');

    expect(emailInput).toHaveValue('admin@test.com');
    expect(passwordInput).toHaveValue('Admin123!');
  });

  it('muestra error con credenciales incorrectas', async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValue(new Error('Credenciales inválidas'));

    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText('Contraseña', { selector: 'input' });
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'invalid@test.com');
    await user.type(passwordInput, 'WrongPassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('invalid@test.com', 'WrongPassword');
    });
  });

  it('redirige después de login exitoso', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({});

    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText('Contraseña', { selector: 'input' });
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'Admin123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('admin@test.com', 'Admin123!');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('deshabilita el botón mientras carga', async () => {
    const user = userEvent.setup();
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText('Contraseña', { selector: 'input' });

    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'Admin123!');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('permite mostrar/ocultar contraseña', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('Contraseña', { selector: 'input' }) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /mostrar contraseña/i });

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('valida que los campos no estén vacíos', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitButton);

    expect(mockSignIn).not.toHaveBeenCalled();
  });
});
