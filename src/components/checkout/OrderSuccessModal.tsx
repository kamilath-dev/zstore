import React from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Sparkles, 
  X, 
  ArrowRight,
  Clock,
  Printer,
  ShieldCheck,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Order } from '../../types';
import { formatPrice } from '../../utils/currency';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onViewProfile: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onViewProfile
}) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour ZStore Bénin, je viens de passer la commande ${order.orderNumber} d'un montant de ${formatPrice(order.total)}. Pouvez-vous me confirmer sa bonne prise en compte ? Merci !`
  );

  const getPaymentMethodLabel = () => {
    switch (order.paymentMethod) {
      case 'paiement_livraison':
        return 'Paiement à la Livraison (Espèces ou Mobile Money au coursier)';
      case 'virement_bancaire':
        return 'Virement Bancaire (RIB ZStore Bénin)';
      default:
        return 'Règlement sécurisé';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative bg-[#faf8f5] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header Title */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center mb-3 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Commande Enregistrée avec Succès
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900 pt-1">
                Merci pour votre commande !
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto">
                Votre commande a été transmise à notre atelier ZStore à Cotonou (Haie Vive). 
                Un SMS et un email de confirmation vous ont été adressés.
              </p>
            </div>

            {/* Order Reference Card */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                    Référence de Commande
                  </span>
                  <p className="font-mono text-base font-bold text-amber-900">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                    Montant Total
                  </span>
                  <p className="font-serif text-lg font-bold text-stone-900">
                    {formatPrice(order.total)}
                  </p>
                </div>
              </div>

              {/* Status & Payment Method */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/70 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <Clock className="w-4 h-4 text-amber-800" />
                    <span>Statut : En Attente de Préparation</span>
                  </div>
                  <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-md border border-amber-200 text-stone-700">
                    {order.isPaid ? 'Réglement Validé' : 'En attente d\'encaissement'}
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  <strong>Mode de règlement :</strong> {getPaymentMethodLabel()}
                </p>
                {order.paymentMethod === 'virement_bancaire' && (
                  <div className="mt-2 p-2 bg-white rounded-lg border border-amber-200/80 text-[11px] text-stone-700">
                    <p className="font-semibold text-stone-900">Coordonnées RIB ZStore Bénin :</p>
                    <p>Banque : BOA Bénin / Compte : 0100 2345 6789 01</p>
                    <p>Titulaire : ZStore Bénin SARL • Mentionner : {order.orderNumber}</p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-stone-700 block">
                  Articles commandés ({order.items.length})
                </span>
                <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto pr-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.product.images[0]} 
                          alt="" 
                          className="w-10 h-10 object-cover rounded-md bg-stone-100"
                        />
                        <div>
                          <p className="font-medium text-stone-900 line-clamp-1">{item.product.name}</p>
                          <p className="text-stone-400 text-[11px]">Qté: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-stone-800">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery info */}
              <div className="border-t border-stone-100 pt-3 text-xs text-stone-600 space-y-1">
                <p>
                  <strong>Destinataire :</strong> {order.deliveryDetails.fullName} ({order.deliveryDetails.phone})
                </p>
                <p>
                  <strong>Adresse :</strong> {order.deliveryDetails.district}, {order.deliveryDetails.city} ({order.deliveryDetails.addressDetails})
                </p>
                <p>
                  <strong>Mode de remise :</strong> {order.deliveryDetails.deliveryOption === 'express' ? 'ZStore Express (3h-6h)' : order.deliveryDetails.deliveryOption === 'showroom' ? 'Retrait Showroom Cotonou' : 'Livraison Standard Bénin'}
                </p>
                {order.deliveryDetails.giftWrapping && (
                  <p className="text-amber-800 font-medium">
                    ✨ Emballage cadeau soigné ZStore inclus avec carte personnalisée
                  </p>
                )}
              </div>
            </div>

            {/* Quick Contact & WhatsApp button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={`https://wa.me/22997000000?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>Confirmer sur WhatsApp (+229)</span>
              </a>

              <button
                onClick={handlePrint}
                className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-stone-300"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer le reçu</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="text-xs text-stone-500 hover:text-stone-800 underline"
              >
                Continuer mes achats sur ZStore
              </button>

              <button
                onClick={() => {
                  onClose();
                  onViewProfile();
                }}
                className="px-5 py-2.5 bg-[#262220] hover:bg-stone-800 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>Suivre ma commande dans mon profil</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
