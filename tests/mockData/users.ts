export const mockUsers = {
  admin: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'breynersanchezquintero@gmail.com',
    password: 'Bbreyner18',
    role: 'administrador' as const,
    profile: {
      nombre_completo: 'Admin Test',
      activo: true,
    }
  },
  ventas: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'loaizac114@gmail.com',
    password: 'Bbreyner18',
    role: 'ventas' as const,
    profile: {
      nombre_completo: 'Ventas Test',
      activo: true,
    }
  },
  inventario: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'olayageraldine17@gmail.com',
    password: 'Bbreyner18',
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
