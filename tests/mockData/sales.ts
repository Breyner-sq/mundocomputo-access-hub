export const mockClientes = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    nombre: 'Juan Pérez',
    cedula: '1234567890',
    email: 'juan@example.com',
    telefono: '0999999999',
    direccion: 'Quito, Ecuador',
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    nombre: 'María González',
    cedula: '0987654321',
    email: 'maria@example.com',
    telefono: '0988888888',
    direccion: 'Guayaquil, Ecuador',
    activo: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockLotesInventario = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    producto_id: '20000000-0000-0000-0000-000000000001',
    cantidad: 50,
    precio_compra: 900.00,
    fecha_ingreso: '2024-01-15',
    notas: 'Lote inicial',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    producto_id: '20000000-0000-0000-0000-000000000002',
    cantidad: 100,
    precio_compra: 15.00,
    fecha_ingreso: '2024-01-15',
    notas: 'Lote inicial',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
];

export const mockVentaData = {
  cliente_id: '30000000-0000-0000-0000-000000000001',
  items: [
    {
      producto_id: '20000000-0000-0000-0000-000000000001',
      cantidad: 2,
      precio_unitario: 1200.00,
    },
    {
      producto_id: '20000000-0000-0000-0000-000000000002',
      cantidad: 5,
      precio_unitario: 25.00,
    },
  ],
  total: 2525.00,
};

export const mockVentaSinStock = {
  cliente_id: '30000000-0000-0000-0000-000000000001',
  items: [
    {
      producto_id: '20000000-0000-0000-0000-000000000001',
      cantidad: 100, // Más de lo disponible
      precio_unitario: 1200.00,
    },
  ],
  total: 120000.00,
};
