-- Función para procesar una venta completa de forma transaccional
CREATE OR REPLACE FUNCTION public.procesar_venta(
  p_cliente_id UUID,
  p_vendedor_id UUID,
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_venta_id UUID;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_producto_id UUID;
  v_cantidad INTEGER;
  v_precio_unitario NUMERIC;
  v_subtotal NUMERIC;
  v_stock_disponible INTEGER;
  v_lotes RECORD;
  v_cantidad_a_descontar INTEGER;
  v_cantidad_restante INTEGER;
BEGIN
  -- Validar que existan items
  IF jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Debe agregar al menos un producto a la venta';
  END IF;

  -- Validar stock disponible para todos los productos PRIMERO
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INTEGER;
    
    -- Calcular stock total disponible
    SELECT COALESCE(SUM(cantidad), 0) INTO v_stock_disponible
    FROM lotes_inventario
    WHERE producto_id = v_producto_id
      AND cantidad > 0;
    
    IF v_stock_disponible < v_cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para producto %. Disponible: %, Requerido: %', 
        v_producto_id, v_stock_disponible, v_cantidad;
    END IF;
  END LOOP;

  -- Descontar inventario usando FIFO
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INTEGER;
    v_cantidad_restante := v_cantidad;
    
    -- Descontar de los lotes más antiguos primero (FIFO)
    FOR v_lotes IN 
      SELECT id, cantidad
      FROM lotes_inventario
      WHERE producto_id = v_producto_id
        AND cantidad > 0
      ORDER BY fecha_ingreso ASC
    LOOP
      IF v_cantidad_restante <= 0 THEN
        EXIT;
      END IF;
      
      v_cantidad_a_descontar := LEAST(v_lotes.cantidad, v_cantidad_restante);
      
      -- Actualizar el lote
      UPDATE lotes_inventario
      SET cantidad = cantidad - v_cantidad_a_descontar,
          updated_at = now()
      WHERE id = v_lotes.id;
      
      v_cantidad_restante := v_cantidad_restante - v_cantidad_a_descontar;
    END LOOP;
    
    IF v_cantidad_restante > 0 THEN
      RAISE EXCEPTION 'No se pudo descontar toda la cantidad para producto %', v_producto_id;
    END IF;
  END LOOP;

  -- Calcular total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_subtotal := (v_item->>'subtotal')::NUMERIC;
    v_total := v_total + v_subtotal;
  END LOOP;

  -- Crear la venta
  INSERT INTO ventas (cliente_id, vendedor_id, total)
  VALUES (p_cliente_id, p_vendedor_id, v_total)
  RETURNING id INTO v_venta_id;

  -- Insertar items de venta
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'producto_id')::UUID;
    v_cantidad := (v_item->>'cantidad')::INTEGER;
    v_precio_unitario := (v_item->>'precio_unitario')::NUMERIC;
    v_subtotal := (v_item->>'subtotal')::NUMERIC;
    
    INSERT INTO venta_items (venta_id, producto_id, cantidad, precio_unitario, subtotal)
    VALUES (v_venta_id, v_producto_id, v_cantidad, v_precio_unitario, v_subtotal);
  END LOOP;

  -- Obtener la venta completa para retornar
  RETURN jsonb_build_object(
    'success', true,
    'venta_id', v_venta_id,
    'total', v_total,
    'message', 'Venta procesada exitosamente'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- En caso de error, PostgreSQL automáticamente hace rollback de toda la transacción
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Error al procesar la venta'
    );
END;
$$;