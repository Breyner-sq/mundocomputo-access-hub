export const mockClientes = [
  {
    id: 'cliente-1',
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '3001234567',
    cedula: '1234567890',
    direccion: 'Calle 123',
    activo: true,
  },
  {
    id: 'cliente-2',
    nombre: 'María García',
    email: 'maria@example.com',
    telefono: '3009876543',
    cedula: '9876543210',
    direccion: 'Carrera 45',
    activo: true,
  },
];

export const mockTecnicos = [
  {
    id: 'tecnico-1',
    email: 'tecnico1@example.com',
    nombre_completo: 'Carlos Técnico',
    activo: true,
  },
  {
    id: 'tecnico-2',
    email: 'tecnico2@example.com',
    nombre_completo: 'Ana Reparadora',
    activo: true,
  },
];

export const mockReparaciones = [
  {
    id: 'reparacion-1',
    numero_orden: 'ORD-00000001',
    cliente_id: 'cliente-1',
    tecnico_id: 'tecnico-1',
    tipo_producto: 'Laptop',
    marca: 'HP',
    modelo: 'Pavilion 15',
    numero_serie: 'SN123456',
    descripcion_falla: 'No enciende, se escucha ruido extraño',
    estado_fisico: 'Golpes en la tapa, pantalla en buen estado',
    estado: 'recibido',
    estado_cotizacion: 'pendiente',
    costo_total: 0,
    pagado: false,
    fecha_ingreso: new Date('2024-01-15').toISOString(),
    fotos_ingreso: [],
    fotos_entrega: [],
  },
  {
    id: 'reparacion-2',
    numero_orden: 'ORD-00000002',
    cliente_id: 'cliente-2',
    tecnico_id: 'tecnico-2',
    tipo_producto: 'PC Desktop',
    marca: 'Dell',
    modelo: 'Optiplex 7080',
    numero_serie: 'SN789012',
    descripcion_falla: 'Lento, se congela constantemente',
    estado_fisico: 'Buen estado general',
    estado: 'en_diagnostico',
    estado_cotizacion: 'pendiente',
    costo_total: 0,
    pagado: false,
    fecha_ingreso: new Date('2024-01-16').toISOString(),
    fotos_ingreso: [],
    fotos_entrega: [],
  },
  {
    id: 'reparacion-3',
    numero_orden: 'ORD-00000003',
    cliente_id: 'cliente-1',
    tecnico_id: 'tecnico-1',
    tipo_producto: 'Laptop',
    marca: 'Lenovo',
    modelo: 'ThinkPad X1',
    numero_serie: 'SN345678',
    descripcion_falla: 'Pantalla rota',
    estado_fisico: 'Pantalla quebrada, resto en buen estado',
    estado: 'cotizacion_hecha',
    estado_cotizacion: 'pendiente',
    costo_total: 450000,
    pagado: false,
    fecha_ingreso: new Date('2024-01-10').toISOString(),
    fotos_ingreso: [],
    fotos_entrega: [],
  },
];

export const mockRepuestos = [
  {
    id: 'repuesto-1',
    reparacion_id: 'reparacion-3',
    descripcion: 'Pantalla LCD 14" Full HD',
    cantidad: 1,
    costo: 350000,
    aceptado: true,
  },
  {
    id: 'repuesto-2',
    reparacion_id: 'reparacion-3',
    descripcion: 'Mano de obra instalación pantalla',
    cantidad: 1,
    costo: 100000,
    aceptado: true,
  },
];

export const mockPagos = [
  {
    id: 'pago-1',
    reparacion_id: 'reparacion-3',
    monto: 450000,
    metodo_pago: 'tarjeta',
    estado: 'completado',
    fecha_pago: new Date('2024-01-17').toISOString(),
    numero_transaccion: 'TXN123456',
  },
];

export const mockNuevaReparacion = {
  cliente_id: 'cliente-1',
  tecnico_id: 'tecnico-1',
  tipo_producto: 'Laptop',
  marca: 'Asus',
  modelo: 'VivoBook 15',
  numero_serie: 'SN999888',
  descripcion_falla: 'No carga la batería',
  estado_fisico: 'Excelente estado exterior',
};

export const mockReparacionInvalida = {
  cliente_id: '',
  tecnico_id: '',
  tipo_producto: '',
  marca: '',
  modelo: '',
  descripcion_falla: '',
};

export const mockEstadosReparacion = [
  'recibido',
  'en_diagnostico',
  'cotizacion_hecha',
  'cotizacion_aceptada',
  'esperando_repuestos',
  'en_reparacion',
  'listo_para_entregar',
  'entregado',
];
