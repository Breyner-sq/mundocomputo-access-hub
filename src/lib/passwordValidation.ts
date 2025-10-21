// Política de contraseñas: mínimo 8 caracteres, una mayúscula, números y un carácter especial
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordStrengthLabel(password: string): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
} {
  const result = validatePassword(password);
  
  if (result.isValid) {
    return { label: 'Fuerte', variant: 'default' };
  }
  
  if (password.length >= 8 && result.errors.length <= 2) {
    return { label: 'Media', variant: 'secondary' };
  }
  
  return { label: 'Débil', variant: 'destructive' };
}
