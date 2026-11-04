import React from 'react';
import { Star, Quote, MapPin } from 'lucide-react';

export const Testimonials: React.FC = () => {
  const testimonials = [
    {
      author: 'Amina Kouassi',
      location: 'Cotonou (Haie Vive)',
      comment: 'La bougie Coucher de Soleil sur Ouidah est devenue notre rituel du soir. Les notes d\'ambre et de vanille embaument notre pièce avec une finesse incroyable.',
      product: 'Bougie Coucher de Soleil sur Ouidah',
      rating: 5,
    },
    {
      author: 'Jean-Marc Dossou',
      location: 'Abomey-Calavi (Arconville)',
      comment: 'Service client impeccable à Cotonou ! J\'ai commandé le coffret Sérénité d\'Intérieur un matin à 10h, livré à 14h dans un emballage noir et ruban terracotta magnifique.',
      product: 'Coffret Écrin Signature',
      rating: 5,
    },
    {
      author: 'Mireille Badarou',
      location: 'Cotonou (Cadjehoun)',
      comment: 'Le vase cannelé terracotta est une véritable œuvre d\'art. La texture du grès apporte tellement de chaleur à notre salle à manger.',
      product: 'Vase Cannelé Terracotta',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-stone-900 text-stone-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-amber-400 font-semibold">
            Témoignages & Avis Vérifiés
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white">
            Ils ont choisi la Maison ZStore
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm font-light">
            Découvrez les retours de nos clients à Cotonou, Calavi, Porto-Novo et de la diaspora béninoise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-stone-800/80 p-6 sm:p-8 rounded-2xl border border-stone-700/60 shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-amber-500/30" />
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed italic font-light">
                  "{t.comment}"
                </p>
              </div>

              <div className="pt-6 border-t border-stone-700/80 mt-6">
                <p className="font-semibold text-stone-100 text-xs sm:text-sm">{t.author}</p>
                <div className="flex items-center gap-1 text-[11px] text-amber-300/80 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>{t.location}</span>
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">
                  Acheté : {t.product}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
