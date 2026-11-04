import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Gift, 
  ArrowRight,
  Sparkles,
  AlertCircle,
  LogIn
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { DeliveryDetails, PaymentMethod } from '../../types';
import { formatPrice, calculateDeliveryFee } from '../../utils/currency';
import { SecurePaymentNotice } from '../common/DemoBadge';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { 
    cart, 
    cartSubtotal, 
    promoDiscount, 
    appliedPromo, 
    placeOrder 
  } = useStore();
  const { user, firebaseUser, openAuthModal } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+229 ');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Cotonou');
  const [district, setDistrict] = useState('Haie Vive');
  const [addressDetails, setAddressDetails] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express' | 'showroom'>('standard');
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paiement_livraison');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync with authenticated customer profile
  useEffect(() => {
    if (user) {
      if (user.displayName && !fullName) setFullName(user.displayName);
      if (user.email && !email) setEmail(user.email);
      if (user.phone && phone === '+229 ') setPhone(user.phone);
      if (user.city) setCity(user.city);
      if (user.district) setDistrict(user.district);
    }
  }, [user]);

  if (!isOpen) return null;

  const deliveryFee = calculateDeliveryFee(city, deliveryOption, cartSubtotal);
  const finalTotal = Math.max(0, cartSubtotal + deliveryFee - promoDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firebaseUser) {
      setErrorMessage("Veuillez vous connecter pour lier votre commande à votre compte client et suivre votre livraison.");
      openAuthModal("finaliser votre commande");
      return;
    }

    if (cart.length === 0) {
      setErrorMessage("Votre panier est vide.");
      return;
    }

    setIsSubmitting(true);

    const deliveryDetails: DeliveryDetails = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      city,
      district: district.trim(),
      addressDetails: addressDetails.trim(),
      deliveryOption,
      giftWrapping,
      giftMessage: giftWrapping ? giftMessage.trim() : undefined
    };

    try {
      await placeOrder(deliveryDetails, paymentMethod);
      setIsSubmitting(false);
      onClose();
      onOrderSuccess();
    } catch (err: any) {
      console.error("Order error:", err);
      setIsSubmitting(false);
      setErrorMessage(err?.message || "Une erreur est survenue lors de l'enregistrement de votre commande.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/65 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 lg:p-8">
        <div className="relative bg-[#faf8f5] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
          
          {/* Header */}
          <div className="p-5 sm:p-6 bg-white border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif text-sm">
                ZS
              </div>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-stone-900">
                  Finaliser ma Commande
                </h2>
                <p className="text-stone-500 text-xs">
                  Livraison soignée à Cotonou & partout au Bénin • ZStore
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-7">
            
            {/* Auth Notice if not logged in */}
            {!firebaseUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <LogIn className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Connexion Client Requise</p>
                    <p className="text-stone-600 text-[11px] mt-0.5">
                      Connectez-vous avec Google ou Email pour rattacher votre commande et accéder à votre suivi en temps réel.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openAuthModal("valider votre commande")}
                  className="px-4 py-2 bg-stone-900 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
                >
                  Se connecter / S'inscrire
                </button>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Impossible de valider la commande</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Transparent Payment & Delivery Notice */}
            <SecurePaymentNotice />

            {/* Section 1: Coordonnées & Livraison au Bénin */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2">
                <MapPin className="w-4 h-4 text-amber-800" />
                1. Destinataire & Adresse de Livraison (Bénin)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    Nom & Prénoms complets *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Sophie Dossou"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:border-amber-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    Numéro de Téléphone (Bénin +229) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 97 12 34 56"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:border-amber-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    Adresse Email (pour confirmation & reçu) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@domaine.com"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:border-amber-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    Ville de destination *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:border-amber-700 focus:outline-none cursor-pointer"
                  >
                    <option value="Cotonou">Cotonou</option>
                    <option value="Abomey-Calavi">Abomey-Calavi</option>
                    <option value="Porto-Novo">Porto-Novo</option>
                    <option value="Ouidah">Ouidah</option>
                    <option value="Parakou">Parakou (Expédition sécurisée)</option>
                    <option value="Autre commune du Bénin">Autre commune du Bénin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    Quartier ou Zone *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Ex: Haie Vive, Cadjehoun, Akpakpa, Arconville..."
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:border-amber-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700 block mb-1">
                    Précisions & Repère pour le coursier *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="Ex: Face pharmacie, portail vert, villa 12"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl focus:border-amber-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Delivery Option Selection */}
              <div className="pt-2">
                <label className="text-xs font-medium text-stone-700 block mb-2">
                  Mode de Livraison
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setDeliveryOption('standard')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deliveryOption === 'standard'
                        ? 'border-amber-800 bg-amber-50/70 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-stone-900">Standard Bénin</span>
                      <Truck className="w-4 h-4 text-amber-800" />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">24h à 48h ouvrées</p>
                    <p className="text-xs font-bold text-stone-800 mt-2">
                      {deliveryFee === 0 && deliveryOption === 'standard'
                        ? 'Offerte'
                        : formatPrice(calculateDeliveryFee(city, 'standard', cartSubtotal))}
                    </p>
                  </div>

                  <div
                    onClick={() => setDeliveryOption('express')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deliveryOption === 'express'
                        ? 'border-amber-800 bg-amber-50/70 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-stone-900">ZStore Express</span>
                      <Sparkles className="w-4 h-4 text-amber-700" />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">3h à 6h (Cotonou / Calavi)</p>
                    <p className="text-xs font-bold text-stone-800 mt-2">
                      {formatPrice(calculateDeliveryFee(city, 'express', cartSubtotal))}
                    </p>
                  </div>

                  <div
                    onClick={() => setDeliveryOption('showroom')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      deliveryOption === 'showroom'
                        ? 'border-amber-800 bg-amber-50/70 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-stone-900">Retrait Showroom</span>
                      <MapPin className="w-4 h-4 text-stone-600" />
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">Haie Vive, Cotonou</p>
                    <p className="text-xs font-bold text-emerald-700 mt-2">Gratuit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Emballage Cadeau */}
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrapping}
                  onChange={(e) => setGiftWrapping(e.target.checked)}
                  className="rounded text-amber-800 focus:ring-amber-500 accent-amber-800"
                />
                <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-amber-700" />
                  Cette commande est un cadeau (Emballage de luxe offert & mot manuscrit)
                </span>
              </label>

              {giftWrapping && (
                <div className="pt-2">
                  <label className="text-[11px] font-medium text-stone-700 block mb-1">
                    Message à inscrire sur la carte calligraphiée ZStore :
                  </label>
                  <textarea
                    rows={2}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="Ex: Joyeux anniversaire ma chère Amina ! Avec toute mon affection."
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
                  />
                </div>
              )}
            </div>

            {/* Section 3: Mode de Règlement */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-semibold text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2">
                <CreditCard className="w-4 h-4 text-amber-800" />
                2. Mode de Règlement Sécurisé
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Paiement à la livraison (Active) */}
                <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'paiement_livraison'
                    ? 'border-amber-800 bg-amber-50/80 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="paiement_livraison"
                    checked={paymentMethod === 'paiement_livraison'}
                    onChange={() => setPaymentMethod('paiement_livraison')}
                    className="mt-0.5 accent-amber-800"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                      Paiement à la Livraison (Recommandé)
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Réglez en espèces ou par Mobile Money remis au coursier à la remise de votre paquet.
                    </p>
                  </div>
                </label>

                {/* Option 2: Virement bancaire (Active) */}
                <label className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === 'virement_bancaire'
                    ? 'border-amber-800 bg-amber-50/80 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="virement_bancaire"
                    checked={paymentMethod === 'virement_bancaire'}
                    onChange={() => setPaymentMethod('virement_bancaire')}
                    className="mt-0.5 accent-amber-800"
                  />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-stone-700" />
                      Virement Bancaire (Bénin / UEMOA)
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Instructions RIB communiquées immédiatement avec la confirmation d'ordre.
                    </p>
                  </div>
                </label>

                {/* Option 3: MTN Momo API (Planned) */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/80 opacity-75 flex items-start gap-3">
                  <input
                    type="radio"
                    disabled
                    checked={false}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-amber-600" />
                        MTN Mobile Money Direct
                      </span>
                      <span className="text-[9px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
                        Bientôt disponible
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      En cours d'intégration API marchande. Pour régler par Momo, choisissez le règlement au coursier.
                    </p>
                  </div>
                </div>

                {/* Option 4: Moov Money API (Planned) */}
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/80 opacity-75 flex items-start gap-3">
                  <input
                    type="radio"
                    disabled
                    checked={false}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-700 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-blue-600" />
                        Moov Money Direct
                      </span>
                      <span className="text-[9px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
                        Bientôt disponible
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      En cours d'intégration API marchande. Pour régler par Moov, choisissez le règlement au coursier.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Récapitulatif Final */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-3">
              <h4 className="font-serif text-base font-semibold text-stone-900">
                Récapitulatif de la commande ({cart.length} article{cart.length > 1 ? 's' : ''})
              </h4>

              <div className="space-y-1.5 text-xs text-stone-600 border-b border-stone-100 pb-3">
                <div className="flex justify-between">
                  <span>Sous-total articles</span>
                  <span>{formatPrice(cartSubtotal)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Remise promotionnelle ({appliedPromo?.code})</span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frais de livraison ({city} - {deliveryOption})</span>
                  <span>{deliveryFee === 0 ? 'Offerts' : formatPrice(deliveryFee)}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <div>
                  <span className="font-serif text-lg font-bold text-stone-900">Total à payer</span>
                  <span className="text-[11px] text-stone-400 block font-sans">TVA & emballage soigné ZStore inclus</span>
                </div>
                <span className="font-serif text-2xl font-bold text-amber-900">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-4 bg-[#262220] hover:bg-amber-800 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-stone-900/10 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Validation Firestore & réservation du stock...</span>
                ) : (
                  <>
                    <span>Valider & Commander • {formatPrice(finalTotal)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-stone-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Showroom & Service client Cotonou : +229 97 00 00 00</span>
              </div>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
