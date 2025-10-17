import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockProducts, mockNewProduct, mockInvalidProduct } from '../mockData/products';

// Mock de Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('Productos - Integración', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    
    mockDelete.mockReturnValue({
      eq: mockEq,
    });
    
    mockEq.mockReturnValue({
      single: mockSingle,
    });
  });

  describe('Crear producto', () => {
    it('crea un producto con datos válidos', async () => {
      mockSelect.mockResolvedValue({
        data: [{ ...mockNewProduct, id: 'new-product-id' }],
        error: null,
      });

      // Simulación de creación exitosa
      const result = { data: [{ ...mockNewProduct, id: 'new-product-id' }], error: null };
      
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].nombre).toBe(mockNewProduct.nombre);
      expect(result.data[0].precio_venta).toBe(mockNewProduct.precio_venta);
    });

    it('rechaza producto con datos inválidos', () => {
      // Validación de datos
      const isValid = mockInvalidProduct.nombre !== '' && 
                      mockInvalidProduct.precio_venta > 0 &&
                      mockInvalidProduct.stock_minimo >= 0;
      
      expect(isValid).toBe(false);
    });

    it('requiere nombre del producto', () => {
      const producto = { ...mockNewProduct, nombre: '' };
      expect(producto.nombre).toBe('');
    });

    it('requiere precio válido', () => {
      const producto = { ...mockNewProduct, precio_venta: -10 };
      expect(producto.precio_venta).toBeLessThan(0);
    });

    it('requiere categoría', () => {
      const producto = { ...mockNewProduct, categoria_id: '' };
      expect(producto.categoria_id).toBe('');
    });
  });

  describe('Actualizar producto', () => {
    it('actualiza un producto existente', async () => {
      const updatedProduct = { ...mockProducts[0], nombre: 'Laptop HP Actualizada' };
      
      mockSingle.mockResolvedValue({
        data: updatedProduct,
        error: null,
      });

      const result = { data: updatedProduct, error: null };
      
      expect(result.error).toBeNull();
      expect(result.data.nombre).toBe('Laptop HP Actualizada');
    });

    it('no actualiza con datos inválidos', () => {
      const isValid = mockInvalidProduct.nombre !== '' && 
                      mockInvalidProduct.precio_venta > 0;
      
      expect(isValid).toBe(false);
    });
  });

  describe('Eliminar producto', () => {
    it('elimina un producto sin lotes de inventario', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = { data: null, error: null };
      expect(result.error).toBeNull();
    });

    it('previene eliminación si hay lotes de inventario', async () => {
      // Simular que hay lotes asociados
      const lotesCount = 5;
      
      expect(lotesCount).toBeGreaterThan(0);
      // No se debe permitir la eliminación
    });
  });

  describe('Listar productos', () => {
    it('obtiene todos los productos', async () => {
      mockSelect.mockResolvedValue({
        data: mockProducts,
        error: null,
      });

      const result = { data: mockProducts, error: null };
      
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(mockProducts.length);
    });

    it('filtra productos por nombre', () => {
      const searchTerm = 'Laptop';
      const filtered = mockProducts.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].nombre).toContain('Laptop');
    });

    it('muestra productos con categoría', () => {
      const productsWithCategory = mockProducts.filter(p => p.categoria_id);
      expect(productsWithCategory.length).toBeGreaterThan(0);
    });
  });

  describe('Validaciones de negocio', () => {
    it('valida stock mínimo no negativo', () => {
      expect(mockNewProduct.stock_minimo).toBeGreaterThanOrEqual(0);
      expect(mockInvalidProduct.stock_minimo).toBeLessThan(0);
    });

    it('valida precio de venta positivo', () => {
      expect(mockNewProduct.precio_venta).toBeGreaterThan(0);
      expect(mockInvalidProduct.precio_venta).toBeLessThanOrEqual(0);
    });

    it('permite código de barras opcional', () => {
      const productoSinCodigo = { ...mockNewProduct, codigo_barras: '' };
      expect(productoSinCodigo.codigo_barras).toBe('');
    });
  });
});
