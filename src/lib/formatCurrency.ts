// Formatear números como moneda colombiana (COP)
export function formatCOP(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '$0';
  
  // Formatear con puntos como separadores de miles
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
  
  return formatted;
}

// Parsear valor formateado de vuelta a número
export function parseCOP(formattedAmount: string): number {
  // Eliminar el símbolo de peso, puntos y espacios
  const cleaned = formattedAmount.replace(/[$\s.]/g, '').replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
}
