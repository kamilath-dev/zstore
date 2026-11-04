import type { DeliveryDetails, PaymentMethod } from '../types';

export interface OrderRequestItem {
  productId: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface ValidatedOrderRequest {
  idempotencyKey: string;
  items: OrderRequestItem[];
  deliveryDetails: DeliveryDetails;
  paymentMethod: PaymentMethod;
  promoCode?: string;
}

const paymentMethods: PaymentMethod[] = [
  'paiement_livraison',
  'virement_bancaire',
  'mtn_momo_planned',
  'moov_money_planned'
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function optionalText(value: unknown, maximum: number): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length <= maximum);
}

export function validateOrderRequest(value: unknown): ValidatedOrderRequest {
  if (!isRecord(value)) throw new Error('Données de commande invalides.');

  const { idempotencyKey, items, deliveryDetails, paymentMethod, promoCode } = value;
  if (
    typeof idempotencyKey !== 'string' ||
    !/^[a-zA-Z0-9-]{16,64}$/.test(idempotencyKey)
  ) {
    throw new Error('Clé de commande invalide. Veuillez réessayer.');
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw new Error('Le panier doit contenir entre 1 et 50 lignes.');
  }
  if (!isRecord(deliveryDetails)) {
    throw new Error('Les informations de livraison sont invalides.');
  }

  const validatedItems = items.map((item): OrderRequestItem => {
    if (!isRecord(item)) throw new Error('Une ligne du panier est invalide.');
    if (
      typeof item.productId !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,128}$/.test(item.productId) ||
      !Number.isSafeInteger(item.quantity) ||
      (item.quantity as number) < 1 ||
      (item.quantity as number) > 1000 ||
      !optionalText(item.selectedColor, 100) ||
      !optionalText(item.selectedSize, 100)
    ) {
      throw new Error('Une ligne du panier contient des données invalides.');
    }

    return {
      productId: item.productId,
      quantity: item.quantity as number,
      ...(item.selectedColor === undefined ? {} : { selectedColor: item.selectedColor }),
      ...(item.selectedSize === undefined ? {} : { selectedSize: item.selectedSize })
    };
  });

  const details = deliveryDetails;
  if (
    !requiredText(details.fullName, 120) ||
    !requiredText(details.phone, 40) ||
    !requiredText(details.email, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) ||
    !requiredText(details.city, 100) ||
    !requiredText(details.district, 120) ||
    !requiredText(details.addressDetails, 500) ||
    !['standard', 'express', 'showroom'].includes(String(details.deliveryOption)) ||
    typeof details.giftWrapping !== 'boolean' ||
    !optionalText(details.deliveryDate, 40) ||
    !optionalText(details.deliveryTimeSlot, 80) ||
    !optionalText(details.giftMessage, 500)
  ) {
    throw new Error('Les informations de livraison sont invalides.');
  }

  if (!paymentMethods.includes(paymentMethod as PaymentMethod)) {
    throw new Error('Le mode de paiement est invalide.');
  }
  if (promoCode !== undefined && (
    typeof promoCode !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,50}$/.test(promoCode)
  )) {
    throw new Error('Le code promotionnel est invalide.');
  }

  const normalizedDetails: DeliveryDetails = {
    fullName: details.fullName.trim(),
    phone: details.phone.trim(),
    email: details.email.trim(),
    city: details.city.trim(),
    district: details.district.trim(),
    addressDetails: details.addressDetails.trim(),
    deliveryOption: details.deliveryOption as DeliveryDetails['deliveryOption'],
    giftWrapping: details.giftWrapping,
    ...(details.deliveryDate === undefined ? {} : { deliveryDate: details.deliveryDate }),
    ...(details.deliveryTimeSlot === undefined ? {} : { deliveryTimeSlot: details.deliveryTimeSlot }),
    ...(details.giftMessage === undefined ? {} : { giftMessage: details.giftMessage.trim() })
  };

  return {
    idempotencyKey,
    items: validatedItems,
    deliveryDetails: normalizedDetails,
    paymentMethod: paymentMethod as PaymentMethod,
    ...(typeof promoCode === 'string' ? { promoCode: promoCode.toUpperCase() } : {})
  };
}
