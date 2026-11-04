/**
 * Currency utilities for ZStore Benin (FCFA / XOF)
 */

export function formatPrice(amount: number): string {
  // Format with space as thousand separator: 25 000 FCFA
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} FCFA`;
}

export function formatPriceEur(amount: number): string {
  // 1 EUR ~ 655.957 FCFA (fixed peg)
  const eur = (amount / 655.957).toFixed(1);
  return `~ ${eur} €`;
}

export function calculateDeliveryFee(city: string, option: 'standard' | 'express' | 'showroom', subtotal: number): number {
  if (option === 'showroom') return 0;
  
  // Free delivery threshold in Cotonou for orders over 35 000 FCFA
  if (subtotal >= 35000 && city.toLowerCase().includes('cotonou') && option === 'standard') {
    return 0;
  }

  const normalizedCity = city.toLowerCase().trim();

  if (normalizedCity.includes('cotonou')) {
    return option === 'express' ? 3000 : 1500;
  } else if (normalizedCity.includes('calavi')) {
    return option === 'express' ? 3500 : 2000;
  } else if (normalizedCity.includes('porto-novo') || normalizedCity.includes('porto novo') || normalizedCity.includes('ouidah')) {
    return option === 'express' ? 5000 : 3500;
  } else if (normalizedCity.includes('parakou')) {
    return 6000;
  }

  return 3000; // Default Benin delivery
}
