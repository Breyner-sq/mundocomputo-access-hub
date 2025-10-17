export const mockUsers = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@test.com',
    password: 'Admin123!',
    role: 'administrador' as const,
    profile: {
      nombre_completo: 'Admin Test',
      activo: true,
    }
  },
  ventas: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'ventas@test.com',
    password: 'Ventas123!',
    role: 'ventas' as const,
    profile: {
      nombre_completo: 'Ventas Test',
      activo: true,
    }
  },
  inventario: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'inventario@test.com',
    password: 'Inventario123!',
    role: 'inventario' as const,
    profile: {
      nombre_completo: 'Inventario Test',
      activo: true,
    }
  },
};

export const mockInvalidCredentials = {
  email: 'invalid@test.com',
  password: 'WrongPassword123!',
};
