// ============================================================
// TransEurop - Utility Functions
// ============================================================

import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import type { Currency, OrderStatus, OrderType, PaymentStatus, ExpenseCategory, ExpenseStatus } from '../types';

/**
 * Format a number as currency with the appropriate symbol
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbols: Record<Currency, string> = {
    EUR: '€',
    GBP: '\£',
    RON: 'RON',
  };
  const formatted = amount.toFixed(2);
  if (currency === 'RON') {
    return `${formatted} RON`;
  }
  return `${symbols[currency]}${formatted}`;
}

/**
 * Format an ISO date string as "DD MMM YYYY" in Romanian locale
 */
export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'dd MMM yyyy', { locale: ro });
  } catch {
    return date;
  }
}

/**
 * Format an ISO date string as "DD MMM YYYY, HH:mm" in Romanian locale
 */
export function formatDateTime(date: string): string {
  try {
    return format(parseISO(date), 'dd MMM yyyy, HH:mm', { locale: ro });
  } catch {
    return date;
  }
}

/**
 * Returns Tailwind text color classes for a given order status
 */
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    nou: 'text-blue-600',
    confirmat: 'text-indigo-600',
    ridicat: 'text-amber-600',
    in_tranzit: 'text-orange-600',
    livrat: 'text-emerald-600',
    finalizat: 'text-green-700',
    anulat: 'text-gray-500',
    problema: 'text-red-600',
    retur: 'text-purple-600',
  };
  return colors[status] ?? 'text-gray-600';
}

/**
 * Returns Tailwind background color classes for a given order status
 */
export function getStatusBgColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    nou: 'bg-blue-100 text-blue-800',
    confirmat: 'bg-indigo-100 text-indigo-800',
    ridicat: 'bg-amber-100 text-amber-800',
    in_tranzit: 'bg-orange-100 text-orange-800',
    livrat: 'bg-emerald-100 text-emerald-800',
    finalizat: 'bg-green-100 text-green-800',
    anulat: 'bg-gray-100 text-gray-600',
    problema: 'bg-red-100 text-red-800',
    retur: 'bg-purple-100 text-purple-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-600';
}

/**
 * Returns a human-readable Romanian label for order status
 */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    nou: 'Nou',
    confirmat: 'Confirmat',
    ridicat: 'Ridicat',
    in_tranzit: 'În Tranzit',
    livrat: 'Livrat',
    finalizat: 'Finalizat',
    anulat: 'Anulat',
    problema: 'Problemă',
    retur: 'Retur',
  };
  return labels[status] ?? status;
}

/**
 * Returns a human-readable Romanian label for order type
 */
export function getOrderTypeLabel(type: OrderType): string {
  const labels: Record<OrderType, string> = {
    colet: 'Colet',
    pasager: 'Pasager',
    masina: 'Mașină',
  };
  return labels[type] ?? type;
}

/**
 * Returns the Lucide icon name for an order type
 */
export function getOrderTypeIcon(type: OrderType): string {
  const icons: Record<OrderType, string> = {
    colet: 'Package',
    pasager: 'User',
    masina: 'Car',
  };
  return icons[type] ?? 'Package';
}

/**
 * Returns a human-readable Romanian label for payment status
 */
export function getPaymentStatusLabel(status: PaymentStatus): string {
  const labels: Record<PaymentStatus, string> = {
    neplatit: 'Neplătit',
    platit: 'Plătit',
    partial: 'Parțial',
  };
  return labels[status] ?? status;
}

/**
 * Returns Tailwind color classes for payment status
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    neplatit: 'text-red-600',
    platit: 'text-green-600',
    partial: 'text-amber-600',
  };
  return colors[status] ?? 'text-gray-600';
}

/**
 * Generates a unique AWB code in the format AWB-2026-XXXXX
 */
export function generateAWB(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `AWB-${year}-${random}`;
}

// ── Expense helpers ───────────────────────────────────────────

export function getExpenseCategoryLabel(cat: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    combustibil: 'Combustibil',
    taxe_drum: 'Taxe drum / Peaje',
    intretinere: 'Întreținere',
    anvelope: 'Anvelope',
    asigurari: 'Asigurări',
    itp_revizie: 'ITP / Revizie',
    spalatorie: 'Spălătorie',
    parcare: 'Parcare',
    cazare: 'Cazare',
    diurna: 'Diurnă',
    amenzi: 'Amenzi',
    piese: 'Piese / Componente',
    taxe_licente: 'Taxe și licențe',
    telefonie: 'Telefonie / GPS',
    altele: 'Altele',
  };
  return labels[cat] ?? cat;
}

export function getExpenseCategoryIcon(cat: ExpenseCategory): string {
  const icons: Record<ExpenseCategory, string> = {
    combustibil: 'Fuel',
    taxe_drum: 'Receipt',
    intretinere: 'Wrench',
    anvelope: 'CircleDot',
    asigurari: 'ShieldCheck',
    itp_revizie: 'ClipboardCheck',
    spalatorie: 'Droplets',
    parcare: 'ParkingSquare',
    cazare: 'Hotel',
    diurna: 'Wallet',
    amenzi: 'AlertTriangle',
    piese: 'Cog',
    taxe_licente: 'FileText',
    telefonie: 'Smartphone',
    altele: 'MoreHorizontal',
  };
  return icons[cat] ?? 'MoreHorizontal';
}

export function getExpenseStatusLabel(status: ExpenseStatus): string {
  const labels: Record<ExpenseStatus, string> = {
    in_asteptare: 'În așteptare',
    aprobat: 'Aprobat',
    respins: 'Respins',
  };
  return labels[status] ?? status;
}

export function getExpenseStatusVariant(status: ExpenseStatus): 'warning' | 'success' | 'danger' {
  const map: Record<ExpenseStatus, 'warning' | 'success' | 'danger'> = {
    in_asteptare: 'warning',
    aprobat: 'success',
    respins: 'danger',
  };
  return map[status] ?? 'warning';
}
