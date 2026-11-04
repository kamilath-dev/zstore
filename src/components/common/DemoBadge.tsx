import React from 'react';
import { ShieldCheck, MapPin, CheckCircle, Info } from 'lucide-react';

interface DemoBadgeProps {
  label?: string;
  size?: 'sm' | 'md';
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ 
  label = 'Showroom Haie Vive • Cotonou', 
  size = 'sm' 
}) => {
  return (
    <span 
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-amber-300/80 bg-amber-50/90 text-amber-900 tracking-wide ${
        size === 'sm' ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1'
      }`}
    >
      <MapPin className="w-3 h-3 text-amber-700" />
      <span>{label}</span>
    </span>
  );
};

export const SecurePaymentNotice: React.FC = () => {
  return (
    <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-4 text-xs text-stone-600 space-y-2">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span className="font-semibold text-stone-800">
          Modalités de Paiement & Livraison Sécurisée (Bénin)
        </span>
      </div>
      <p className="text-stone-500 leading-relaxed text-[11px]">
        <strong>Paiement à la livraison :</strong> Règlement en espèces ou par Mobile Money (MTN / Moov) directement auprès du coursier à la remise de votre colis en mains propres.
      </p>
      <p className="text-stone-500 leading-relaxed text-[11px]">
        <strong>Virement bancaire :</strong> Instructions RIB ZStore Bénin (Banque Atlantique / BOA) transmises dès validation de commande.
      </p>
      <div className="flex items-center gap-1.5 text-[10px] text-amber-800 bg-amber-50/80 px-2.5 py-1.5 rounded-lg border border-amber-200/60">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>Les passerelles marchandes MTN Moov API directes sont en cours de raccordement technique.</span>
      </div>
    </div>
  );
};
