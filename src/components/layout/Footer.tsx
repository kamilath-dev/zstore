import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  Instagram, 
  Facebook,
  Heart
} from 'lucide-react';
import { CategorySlug } from '../../types';
import { DemoBadge } from '../common/DemoBadge';

interface FooterProps {
  onNavigateCatalog: (category: CategorySlug | 'all') => void;
  onNavigateStory: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateCatalog,
  onNavigateStory,
  onOpenAdmin
}) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSent(true);
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-[#201c1a] text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800/80">
          
          {/* Brand Manifesto */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold text-stone-100 tracking-wider">
                ZSTORE
              </span>
              <span className="text-xs uppercase tracking-[0.25em] text-amber-400 font-sans">
                Bénin
              </span>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Maison béninoise de haute décoration olfactive et d'artisanat d'intérieur. 
              Chaque bougie est coulée à la main avec une cire végétale pure, chaque vase célèbre 
              la matière brute et chaque coffret incarne l'art d'offrir avec distinction à Cotonou.
            </p>
            
            {/* Showroom Contact Card */}
            <div className="bg-[#2a2523] p-4 rounded-xl border border-stone-800 space-y-2.5 text-xs text-stone-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-stone-200">Showroom & Atelier</p>
                  <p className="text-stone-400">Rue 340, Quartier Haie Vive, Cotonou, République du Bénin</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="tel:+22997000000" className="hover:text-amber-300 transition-colors">
                  +229 97 00 00 00 (Service Client & WhatsApp)
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-stone-400">Mardi - Samedi: 10h - 19h30 | Dimanche: 14h - 18h</span>
              </div>
            </div>
          </div>

          {/* Catalog Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button 
                  onClick={() => onNavigateCatalog('bougies')}
                  className="hover:text-stone-200 transition-colors"
                >
                  Bougies Parfumées Artisanales
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateCatalog('diffuseurs')}
                  className="hover:text-stone-200 transition-colors"
                >
                  Diffuseurs & Senteurs de Chambre
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateCatalog('vases')}
                  className="hover:text-stone-200 transition-colors"
                >
                  Vases & Grès Chamotté
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateCatalog('decoration')}
                  className="hover:text-stone-200 transition-colors"
                >
                  Plateaux Travertin & Bougeoirs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateCatalog('coffrets')}
                  className="hover:text-stone-200 transition-colors"
                >
                  Coffrets Cadeaux Signatures
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigateCatalog('all')}
                  className="hover:text-stone-200 transition-colors font-medium text-amber-300"
                >
                  Voir Tout le Catalogue →
                </button>
              </li>
            </ul>
          </div>

          {/* Delivery & Assurance in Benin */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Services & Engagements
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Livraison Express à Cotonou (3-6h)</span>
              </li>
              <li>Livraison Abomey-Calavi & Porto-Novo</li>
              <li>Expédition sécurisée vers Parakou & provinces</li>
              <li>Retrait gratuit en boutique Showroom</li>
              <li>Emballage cadeau haut de gamme & mot calligraphié</li>
              <li>
                <button 
                  onClick={onNavigateStory}
                  className="hover:text-stone-200 transition-colors underline"
                >
                  Guide d'entretien de vos bougies & vases
                </button>
              </li>
            </ul>
          </div>

          {/* VIP Fragrance Club / Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-400">
              Le Cercle Privé ZStore
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed">
              Recevez nos invitations aux lancements de senteurs exclusives et obtenez 
              <span className="text-amber-300 font-semibold"> 10% de réduction </span>
              immédiate sur votre première commande avec le code <strong className="text-white">BIENVENUE10</strong>.
            </p>
            
            {newsletterSent ? (
              <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs p-3 rounded-lg flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bienvenue au Cercle ZStore. Votre code BIENVENUE10 est actif !</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex">
                  <input
                    type="email"
                    required
                    placeholder="Votre adresse email..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="bg-[#2a2523] border border-stone-700 text-xs px-3 py-2.5 rounded-l-lg text-white focus:outline-none focus:border-amber-400 w-full"
                  />
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2.5 rounded-r-lg transition-colors flex items-center justify-center shrink-0"
                    aria-label="S'inscrire à la newsletter"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-stone-500">
                  Nous respectons votre confidentialité. Zéro spam.
                </p>
              </form>
            )}

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2 text-stone-400">
              <a href="#" className="hover:text-amber-400 transition-colors" title="Instagram ZStore Bénin">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-amber-400 transition-colors" title="Facebook ZStore Bénin">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="mailto:contact@zstore.bj" className="hover:text-amber-400 transition-colors" title="Email ZStore Bénin">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} ZStore Bénin SARL. Tous droits réservés.</span>
            <span>•</span>
            <span>Cotonou, République du Bénin.</span>
            <span>•</span>
            <DemoBadge size="sm" />
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <button
              onClick={onOpenAdmin}
              className="text-stone-400 hover:text-amber-300 underline text-xs transition-colors"
            >
              Console d'Administration
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-stone-500 text-[11px]">
              Fait avec <Heart className="w-3 h-3 text-amber-600 fill-amber-600" /> pour Cotonou
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
