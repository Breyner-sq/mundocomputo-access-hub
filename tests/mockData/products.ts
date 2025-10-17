export const mockCategories = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    nombre: 'Electrónica',
    descripcion: 'Productos electrónicos',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    nombre: 'Ropa',
    descripcion: 'Prendas de vestir',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockProducts = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    nombre: 'Laptop HP',
    descripcion: 'Laptop HP 15 pulgadas',
    categoria_id: '10000000-0000-0000-0000-000000000001',
    precio_venta: 1200.00,
    codigo_barras: '1234567890123',
    stock_minimo: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    nombre: 'Mouse Logitech',
    descripcion: 'Mouse inalámbrico',
    categoria_id: '10000000-0000-0000-0000-000000000001',
    precio_venta: 25.00,
    codigo_barras: '1234567890124',
    stock_minimo: 10,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockNewProduct = {
  nombre: 'Teclado Mecánico',
  descripcion: 'Teclado mecánico RGB',
  categoria_id: '10000000-0000-0000-0000-000000000001',
  precio_venta: 80.00,
  codigo_barras: '1234567890125',
  stock_minimo: 8,
};

export const mockInvalidProduct = {
  nombre: '',
  descripcion: 'Producto sin nombre',
  categoria_id: '',
  precio_venta: -10,
  codigo_barras: '',
  stock_minimo: -5,
};
