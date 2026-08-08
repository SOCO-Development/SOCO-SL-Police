export interface FieldError {
  field: string;
  message: string;
}

export type ValidationResult = FieldError[];

export function validatePhone(value: string): string | null {
  if (!value.trim()) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return 'Invalid phone number length';
  return null;
}

export function validateEmail(value: string): string | null {
  if (!value.trim()) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value.trim())) return 'Invalid email format';
  return null;
}

export function validateDateNotFuture(value: string, label: string): string | null {
  if (!value.trim()) return null;
  const parts = value.split('-');
  if (parts.length !== 3) return `${label} has invalid date format`;
  const nums = parts.map(Number);
  if (nums.some(isNaN)) return `${label} has invalid date format`;
  let date: Date;
  if (parts[0].length === 4) {
    date = new Date(nums[0], nums[1] - 1, nums[2]);
  } else {
    date = new Date(nums[2], nums[1] - 1, nums[0]);
  }
  if (isNaN(date.getTime())) return `${label} is not a valid date`;
  if (date > new Date()) return `${label} cannot be in the future`;
  return null;
}

export function validateYear(value: string, label: string, min = 1950, max = new Date().getFullYear() + 5): string | null {
  if (!value.trim()) return null;
  const year = parseInt(value, 10);
  if (isNaN(year) || value.length !== 4) return `${label} must be a 4-digit year`;
  if (year < min || year > max) return `${label} must be between ${min} and ${max}`;
  return null;
}

export function validateRegNo(value: string): string | null {
  if (!value.trim()) return 'Registration number is required';
  if (value.trim().length < 3) return 'Registration number must be at least 3 characters';
  return null;
}

export function validateFullName(value: string): string | null {
  if (!value.trim()) return 'Full name is required';
  if (value.trim().length < 2) return 'Full name must be at least 2 characters';
  if (value.trim().length > 200) return 'Full name is too long';
  return null;
}

export function validateNIC(value: string): string | null {
  if (!value.trim()) return null;
  const trimmed = value.trim();
  const oldNicRegex = /^[0-9]{9}[vVxX]$/;
  const newNicRegex = /^[0-9]{12}$/;
  if (!oldNicRegex.test(trimmed) && !newNicRegex.test(trimmed)) {
    return 'Invalid NIC number (e.g. 901234567V or 199012345678)';
  }
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required`;
  return null;
}

export function validateDateRange(from: string, to: string, label: string): string | null {
  if (!from.trim() || !to.trim()) return null;
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) return null;
  if (toDate < fromDate) return `${label}: To date cannot be before From date`;
  return null;
}

function parseDate(value: string): Date | null {
  const parts = value.split('-');
  if (parts.length !== 3) return null;
  const nums = parts.map(Number);
  if (nums.some(isNaN)) return null;
  if (parts[0].length === 4) return new Date(nums[0], nums[1] - 1, nums[2]);
  return new Date(nums[2], nums[1] - 1, nums[0]);
}

export function formatErrors(errors: FieldError[]): string {
  return errors.map((e) => e.message).join('\n');
}

export function getFieldErrors(errors: FieldError[], field: string): string[] {
  return errors.filter((e) => e.field === field).map((e) => e.message);
}

export function hasFieldError(errors: FieldError[], field: string): boolean {
  return errors.some((e) => e.field === field);
}
