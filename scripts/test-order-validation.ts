import assert from 'node:assert/strict';
import { validateOrderRequest } from '../src/services/orderValidation';

const validRequest = {
  idempotencyKey: '8e03978e-40d5-43e8-bc93-6894a57f9324',
  items: [
    { productId: 'prod-real-1', quantity: 2, selectedColor: 'sable' }
  ],
  deliveryDetails: {
    fullName: 'Client ZStore',
    phone: '+229 97000000',
    email: 'client@example.com',
    city: 'Cotonou',
    district: 'Cadjehoun',
    addressDetails: 'Près du carrefour',
    deliveryOption: 'standard',
    giftWrapping: false
  },
  paymentMethod: 'paiement_livraison',
  promoCode: 'bienvenue10'
};

const parsed = validateOrderRequest(validRequest);
assert.equal(parsed.items[0].quantity, 2);
assert.equal(parsed.promoCode, 'BIENVENUE10');
assert.equal(parsed.deliveryDetails.deliveryOption, 'standard');

assert.throws(
  () => validateOrderRequest({ ...validRequest, items: [{ productId: 'prod-1', quantity: 0 }] }),
  /données invalides/
);
assert.throws(
  () => validateOrderRequest({ ...validRequest, idempotencyKey: 'short' }),
  /Clé de commande invalide/
);
assert.throws(
  () => validateOrderRequest({
    ...validRequest,
    deliveryDetails: { ...validRequest.deliveryDetails, deliveryOption: 'unknown' }
  }),
  /informations de livraison sont invalides/
);
assert.throws(
  () => validateOrderRequest({ ...validRequest, paymentMethod: 'cash' }),
  /mode de paiement est invalide/
);
assert.throws(
  () => validateOrderRequest({
    ...validRequest,
    deliveryDetails: { ...validRequest.deliveryDetails, email: 'not-an-email' }
  }),
  /informations de livraison sont invalides/
);
assert.throws(
  () => validateOrderRequest({ ...validRequest, promoCode: 'bad code' }),
  /code promotionnel est invalide/
);

console.log('Order request validation tests passed.');
