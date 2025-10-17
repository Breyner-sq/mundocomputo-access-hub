import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Mock del hook useAuth
const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock de Navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
  };
});

describe('ProtectedRoute', () => {
  it('muestra loading mientras carga', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      role: null,
      loading: true,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute allowedRoles={['administrador']}>
          <div>Contenido Protegido</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirige a / si no hay usuario', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      role: null,
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute allowedRoles={['administrador']}>
          <div>Contenido Protegido</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Navigate to /')).toBeInTheDocument();
  });

  it('redirige a /unauthorized si el rol no está permitido', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      role: 'ventas',
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute allowedRoles={['administrador']}>
          <div>Contenido Protegido</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Navigate to /unauthorized')).toBeInTheDocument();
  });

  it('muestra el contenido si el usuario tiene el rol correcto', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      role: 'administrador',
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute allowedRoles={['administrador']}>
          <div>Contenido Protegido</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });

  it('permite múltiples roles', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123' },
      role: 'ventas',
      loading: false,
    });

    render(
      <BrowserRouter>
        <ProtectedRoute allowedRoles={['administrador', 'ventas']}>
          <div>Contenido Protegido</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });
});
