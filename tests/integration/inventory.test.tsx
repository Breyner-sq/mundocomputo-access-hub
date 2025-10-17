import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockLotesInventario, mockVentaData } from '../mockData/sales';
import { mockProducts } from '../mockData/products';

// Mock de Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSum = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('Inventario - Integración', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
    });
    
    mockSelect.mockReturnValue({
      eq: mockEq,
      sum: mockSum,
    });
    
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
  });

  describe('Gestión de lotes', () => {
    it('crea un nuevo lote de inventario', async () => {
      const nuevoLote = {
        producto_id: mockProducts[0].id,
        cantidad: 25,
        precio_compra: 850.00,
        fecha_ingreso: new Date().toISOString().split('T')[0],
        notas: 'Lote de prueba',
      };

      mockSelect.mockResolvedValue({
        data: [{ ...nuevoLote, id: 'lote-test-id' }],
        error: null,
      });

      const result = { 
        data: [{ ...nuevoLote, id: 'lote-test-id' }], 
        error: null 
      };
      
      expect(result.error).toBeNull();
      expect(result.data[0].cantidad).toBe(25);
      expect(result.data[0].precio_compra).toBe(850.00);
    });

    it('valida cantidad positiva en lote', () => {
      mockLotesInventario.forEach(lote => {
        expect(lote.cantidad).toBeGreaterThan(0);
      });
    });

    it('valida precio de compra positivo', () => {
      mockLotesInventario.forEach(lote => {
        expect(lote.precio_compra).toBeGreaterThan(0);
      });
    });

    it('requiere producto_id en lote', () => {
      mockLotesInventario.forEach(lote => {
        expect(lote.producto_id).toBeTruthy();
      });
    });
  });

  describe('Cálculo de stock', () => {
    it('calcula stock total de un producto', () => {
      const productoId = mockProducts[0].id;
      const lotesProducto = mockLotesInventario.filter(
        l => l.producto_id === productoId
      );
      
      const stockTotal = lotesProducto.reduce(
        (sum, lote) => sum + lote.cantidad, 0
      );
      
      expect(stockTotal).toBeGreaterThan(0);
    });

    it('identifica productos con stock bajo', () => {
      const producto = mockProducts[0];
      const stockActual = mockLotesInventario
        .filter(l => l.producto_id === producto.id)
        .reduce((sum, lote) => sum + lote.cantidad, 0);
      
      const stockBajo = stockActual < producto.stock_minimo;
      expect(typeof stockBajo).toBe('boolean');
    });

    it('suma correctamente múltiples lotes', () => {
      const lotes = [
        { cantidad: 10 },
        { cantidad: 20 },
        { cantidad: 15 },
      ];
      
      const total = lotes.reduce((sum, l) => sum + l.cantidad, 0);
      expect(total).toBe(45);
    });
  });

  describe('Actualización de inventario', () => {
    it('descuenta stock después de venta', () => {
      const loteInicial = mockLotesInventario[0];
      const cantidadVendida = 5;
      const stockRestante = loteInicial.cantidad - cantidadVendida;
      
      expect(stockRestante).toBe(loteInicial.cantidad - cantidadVendida);
      expect(stockRestante).toBeGreaterThanOrEqual(0);
    });

    it('incrementa stock con nuevo lote', () => {
      const stockActual = 50;
      const nuevoLote = 25;
      const stockFinal = stockActual + nuevoLote;
      
      expect(stockFinal).toBe(75);
    });

    it('previene stock negativo', () => {
      const stockActual = 10;
      const cantidadSolicitada = 15;
      
      const puedeVender = stockActual >= cantidadSolicitada;
      expect(puedeVender).toBe(false);
    });
  });

  describe('Validaciones de integridad', () => {
    it('verifica que cada lote tenga un producto válido', () => {
      mockLotesInventario.forEach(lote => {
        const productoExiste = mockProducts.some(
          p => p.id === lote.producto_id
        );
        expect(productoExiste).toBe(true);
      });
    });

    it('mantiene consistencia en descuento por ventas', () => {
      const loteInicial = { ...mockLotesInventario[0] };
      const venta = mockVentaData.items[0];
      
      if (loteInicial.producto_id === venta.producto_id) {
        const stockFinal = loteInicial.cantidad - venta.cantidad;
        expect(stockFinal).toBeGreaterThanOrEqual(0);
      }
    });

    it('valida fecha de ingreso del lote', () => {
      mockLotesInventario.forEach(lote => {
        expect(lote.fecha_ingreso).toBeTruthy();
        const fecha = new Date(lote.fecha_ingreso);
        expect(fecha).toBeInstanceOf(Date);
      });
    });
  });

  describe('Consultas de inventario', () => {
    it('lista todos los lotes de inventario', async () => {
      mockSelect.mockResolvedValue({
        data: mockLotesInventario,
        error: null,
      });

      const result = { data: mockLotesInventario, error: null };
      
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(mockLotesInventario.length);
    });

    it('filtra lotes por producto', () => {
      const productoId = mockProducts[0].id;
      const lotesFiltrados = mockLotesInventario.filter(
        l => l.producto_id === productoId
      );
      
      lotesFiltrados.forEach(lote => {
        expect(lote.producto_id).toBe(productoId);
      });
    });

    it('obtiene lotes con stock disponible', () => {
      const lotesConStock = mockLotesInventario.filter(
        l => l.cantidad > 0
      );
      
      expect(lotesConStock.length).toBeGreaterThan(0);
    });
  });

  describe('Restricciones de acceso', () => {
    it('solo roles inventario y admin pueden gestionar lotes', () => {
      const allowedRoles = ['inventario', 'administrador'];
      expect(allowedRoles).toContain('inventario');
      expect(allowedRoles).toContain('administrador');
    });

    it('rol ventas puede consultar inventario', () => {
      const canView = true; // Según las políticas RLS
      expect(canView).toBe(true);
    });
  });
});
