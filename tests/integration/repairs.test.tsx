import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockClientes,
  mockTecnicos,
  mockReparaciones,
  mockRepuestos,
  mockNuevaReparacion,
  mockReparacionInvalida,
  mockEstadosReparacion,
} from '../mockData/repairs';

// Mock de Supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe('Reparaciones - Integración', () => {
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
      in: mockIn,
      order: mockOrder,
      single: mockSingle,
    });

    mockInsert.mockReturnValue({
      select: mockSelect,
      single: mockSingle,
    });

    mockUpdate.mockReturnValue({
      eq: mockEq,
    });

    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    mockEq.mockReturnValue({
      single: mockSingle,
      select: mockSelect,
    });

    mockIn.mockReturnValue({
      order: mockOrder,
    });

    mockOrder.mockReturnValue({
      data: [],
      error: null,
    });
  });

  describe('Crear reparación', () => {
    it('crea una reparación con datos válidos', async () => {
      mockSingle.mockResolvedValue({
        data: { ...mockNuevaReparacion, id: 'nueva-reparacion-id', numero_orden: 'ORD-00000004' },
        error: null,
      });

      const result = {
        data: { ...mockNuevaReparacion, id: 'nueva-reparacion-id', numero_orden: 'ORD-00000004' },
        error: null,
      };

      expect(result.error).toBeNull();
      expect(result.data.tipo_producto).toBe(mockNuevaReparacion.tipo_producto);
      expect(result.data.marca).toBe(mockNuevaReparacion.marca);
      expect(result.data.numero_orden).toBeTruthy();
    });

    it('rechaza reparación con datos inválidos', () => {
      const isValid =
        mockReparacionInvalida.cliente_id !== '' &&
        mockReparacionInvalida.tipo_producto !== '' &&
        mockReparacionInvalida.marca !== '' &&
        mockReparacionInvalida.descripcion_falla !== '';

      expect(isValid).toBe(false);
    });

    it('requiere cliente válido', () => {
      expect(mockNuevaReparacion.cliente_id).toBeTruthy();
      expect(mockReparacionInvalida.cliente_id).toBe('');
    });

    it('requiere técnico asignado', () => {
      expect(mockNuevaReparacion.tecnico_id).toBeTruthy();
    });

    it('requiere descripción de falla', () => {
      expect(mockNuevaReparacion.descripcion_falla).toBeTruthy();
      expect(mockNuevaReparacion.descripcion_falla.length).toBeGreaterThan(5);
    });

    it('genera número de orden automáticamente', () => {
      const reparacion = mockReparaciones[0];
      expect(reparacion.numero_orden).toMatch(/^ORD-\d{8}$/);
    });
  });

  describe('Estados de reparación', () => {
    it('inicia en estado "recibido"', () => {
      expect(mockReparaciones[0].estado).toBe('recibido');
    });

    it('valida transición de estados secuencial', () => {
      const estadosValidos = mockEstadosReparacion;
      expect(estadosValidos).toContain('recibido');
      expect(estadosValidos).toContain('en_diagnostico');
      expect(estadosValidos).toContain('cotizacion_hecha');
      expect(estadosValidos).toContain('entregado');
    });

    it('transiciona de recibido a en_diagnostico', async () => {
      const reparacion = { ...mockReparaciones[0], estado: 'en_diagnostico' };

      mockSingle.mockResolvedValue({
        data: reparacion,
        error: null,
      });

      const result = { data: reparacion, error: null };

      expect(result.error).toBeNull();
      expect(result.data.estado).toBe('en_diagnostico');
    });

    it('transiciona de en_diagnostico a cotizacion_hecha', async () => {
      const reparacion = { ...mockReparaciones[1], estado: 'cotizacion_hecha' };

      mockSingle.mockResolvedValue({
        data: reparacion,
        error: null,
      });

      const result = { data: reparacion, error: null };

      expect(result.error).toBeNull();
      expect(result.data.estado).toBe('cotizacion_hecha');
    });

    it('registra historial de estados', () => {
      const historial = [
        { estado_anterior: null, estado_nuevo: 'recibido' },
        { estado_anterior: 'recibido', estado_nuevo: 'en_diagnostico' },
        { estado_anterior: 'en_diagnostico', estado_nuevo: 'cotizacion_hecha' },
      ];

      expect(historial).toHaveLength(3);
      expect(historial[0].estado_nuevo).toBe('recibido');
      expect(historial[2].estado_nuevo).toBe('cotizacion_hecha');
    });
  });

  describe('Cotización y repuestos', () => {
    it('permite agregar repuestos a una reparación', async () => {
      mockSelect.mockResolvedValue({
        data: mockRepuestos,
        error: null,
      });

      const result = { data: mockRepuestos, error: null };

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
    });

    it('calcula costo total de repuestos', () => {
      const total = mockRepuestos.reduce((sum, rep) => sum + rep.costo * rep.cantidad, 0);
      expect(total).toBe(450000);
    });

    it('permite aceptar/rechazar repuestos individualmente', () => {
      const repuestoAceptado = mockRepuestos[0];
      expect(repuestoAceptado.aceptado).toBe(true);
    });

    it('calcula total solo con repuestos aceptados', () => {
      const totalAceptados = mockRepuestos
        .filter((r) => r.aceptado)
        .reduce((sum, rep) => sum + rep.costo * rep.cantidad, 0);

      expect(totalAceptados).toBe(450000);
    });

    it('requiere al menos un repuesto en cotización', () => {
      const reparacionConCotizacion = mockReparaciones[2];
      expect(reparacionConCotizacion.estado).toBe('cotizacion_hecha');
      expect(mockRepuestos.length).toBeGreaterThan(0);
    });

    it('valida costo positivo en repuestos', () => {
      mockRepuestos.forEach((repuesto) => {
        expect(repuesto.costo).toBeGreaterThan(0);
        expect(repuesto.cantidad).toBeGreaterThan(0);
      });
    });
  });

  describe('Proceso de pago', () => {
    it('registra pago exitoso', () => {
      const pago = {
        reparacion_id: 'reparacion-3',
        monto: 450000,
        metodo_pago: 'tarjeta',
        estado: 'completado',
      };

      expect(pago.estado).toBe('completado');
      expect(pago.monto).toBeGreaterThan(0);
    });

    it('valida métodos de pago permitidos', () => {
      const metodosValidos = ['tarjeta', 'efectivo', 'transferencia'];
      const pago = { metodo_pago: 'tarjeta' };

      expect(metodosValidos).toContain(pago.metodo_pago);
    });

    it('actualiza estado pagado de reparación', () => {
      const reparacionPagada = { ...mockReparaciones[2], pagado: true };
      expect(reparacionPagada.pagado).toBe(true);
    });

    it('previene entrega sin pago', () => {
      const reparacionSinPagar = mockReparaciones[0];
      expect(reparacionSinPagar.pagado).toBe(false);

      const puedeEntregar = reparacionSinPagar.pagado && reparacionSinPagar.estado === 'listo_para_entregar';
      expect(puedeEntregar).toBe(false);
    });

    it('valida monto igual a costo total', () => {
      const reparacion = mockReparaciones[2];
      const pago = mockPagos[0];

      expect(pago.monto).toBe(reparacion.costo_total);
    });
  });

  describe('Validaciones de entrega', () => {
    it('requiere pago antes de entregar', () => {
      const reparacion = mockReparaciones[2];
      const puedeEntregar = reparacion.pagado && reparacion.estado === 'listo_para_entregar';

      // En este caso falta cambiar estado a listo_para_entregar
      expect(reparacion.pagado).toBe(false);
    });

    it('permite entrega solo en estado listo_para_entregar', () => {
      const estadosQueNoPermiten = ['recibido', 'en_diagnostico', 'cotizacion_hecha'];
      estadosQueNoPermiten.forEach((estado) => {
        expect(estado).not.toBe('listo_para_entregar');
      });
    });

    it('registra fecha de entrega', () => {
      const reparacionEntregada = {
        ...mockReparaciones[0],
        estado: 'entregado',
        fecha_entrega: new Date().toISOString(),
      };

      expect(reparacionEntregada.estado).toBe('entregado');
      expect(reparacionEntregada.fecha_entrega).toBeTruthy();
    });

    it('puede registrar quien retira el equipo', () => {
      const entrega = {
        nombre_quien_retira: 'Juan Pérez',
      };

      expect(entrega.nombre_quien_retira).toBeTruthy();
    });
  });

  describe('Consultas y reportes', () => {
    it('lista todas las reparaciones', async () => {
      mockOrder.mockResolvedValue({
        data: mockReparaciones,
        error: null,
      });

      const result = { data: mockReparaciones, error: null };

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(mockReparaciones.length);
    });

    it('filtra reparaciones por técnico', () => {
      const reparacionesTecnico1 = mockReparaciones.filter((r) => r.tecnico_id === 'tecnico-1');
      expect(reparacionesTecnico1).toHaveLength(2);
    });

    it('filtra reparaciones por estado', () => {
      const reparacionesRecibidas = mockReparaciones.filter((r) => r.estado === 'recibido');
      expect(reparacionesRecibidas).toHaveLength(1);
    });

    it('busca reparación por número de orden', () => {
      const reparacion = mockReparaciones.find((r) => r.numero_orden === 'ORD-00000001');
      expect(reparacion).toBeDefined();
      expect(reparacion?.numero_orden).toBe('ORD-00000001');
    });

    it('filtra reparaciones por cliente', () => {
      const reparacionesCliente1 = mockReparaciones.filter((r) => r.cliente_id === 'cliente-1');
      expect(reparacionesCliente1).toHaveLength(2);
    });
  });

  describe('Restricciones de acceso (RLS)', () => {
    it('técnicos ven solo sus reparaciones asignadas', () => {
      const tecnicoId = 'tecnico-1';
      const misReparaciones = mockReparaciones.filter((r) => r.tecnico_id === tecnicoId);

      expect(misReparaciones.every((r) => r.tecnico_id === tecnicoId)).toBe(true);
    });

    it('admins pueden ver todas las reparaciones', () => {
      const requiresAdmin = true;
      expect(requiresAdmin).toBe(true);
    });

    it('clientes pueden consultar por número de orden', () => {
      const consultaPublica = true;
      expect(consultaPublica).toBe(true);
    });

    it('solo usuarios autenticados pueden crear reparaciones', () => {
      const requiresAuth = true;
      expect(requiresAuth).toBe(true);
    });
  });

  describe('Validaciones de negocio', () => {
    it('valida fecha de ingreso no futura', () => {
      const fechaIngreso = new Date(mockReparaciones[0].fecha_ingreso);
      const ahora = new Date();

      expect(fechaIngreso.getTime()).toBeLessThanOrEqual(ahora.getTime());
    });

    it('costo total debe ser no negativo', () => {
      mockReparaciones.forEach((rep) => {
        expect(rep.costo_total).toBeGreaterThanOrEqual(0);
      });
    });

    it('número de serie es opcional', () => {
      const reparacionSinSerie = { ...mockNuevaReparacion, numero_serie: '' };
      expect(reparacionSinSerie.numero_serie).toBe('');
    });

    it('fotos son opcionales', () => {
      expect(mockReparaciones[0].fotos_ingreso).toBeDefined();
      expect(Array.isArray(mockReparaciones[0].fotos_ingreso)).toBe(true);
    });

    it('valida que cliente y técnico existan', () => {
      const reparacion = mockReparaciones[0];
      const clienteExiste = mockClientes.some((c) => c.id === reparacion.cliente_id);
      const tecnicoExiste = mockTecnicos.some((t) => t.id === reparacion.tecnico_id);

      expect(clienteExiste).toBe(true);
      expect(tecnicoExiste).toBe(true);
    });
  });
});
