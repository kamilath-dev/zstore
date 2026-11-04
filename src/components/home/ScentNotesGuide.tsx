import React, { useState } from 'react';
import { Flame, Sparkles, Wind, Sun, Coffee } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { CategorySlug } from '../../types';

interface ScentNotesGuideProps {
  onSelectScentFilter: (scent: string) => void;
}

export const ScentNotesGuide: React.FC<ScentNotesGuideProps> = ({ onSelectScentFilter }) => {
  const [activeFamily, setActiveFamily] = useState<number>(0);

  const families = [
    {
      title: 'Ambré & Solaire',
      icon: Sun,
      subtitle: 'Chaleur atlantique & volupté',
      description: 'Des sillages enveloppants qui évoquent les fins d\'après-midi dorées de Ouidah et Grand-Popo. Notes d\'ambre chaud, de vanille bourbon et d\'agrumes confits.',
      filterQuery: 'ambre',
      creations: ['Bougie Coucher de Soleil sur Ouidah', 'Coffret Sérénité Signature']
    },
    {
      title: 'Boisé & Profond',
      icon: Wind,
      subtitle: 'Élégance feutrée & sérénité',
      description: 'L\'esprit d\'une bibliothèque aux boiseries nobles et au calme apaisant. Bois de santal crémeux, cèdre de l\'Atlas et résine d\'encens.',
      filterQuery: 'bois',
      creations: ['Bougie Brume de Santal & Cacao', 'Bougie Cèdre Sauvage']
    },
    {
      title: 'Floral & Frais',
      icon: Sparkles,
      subtitle: 'Lumière méditerranéenne & pureté',
      description: 'L\'aube dans un verger d\'agrumes en fleurs. Fleur d\'oranger vibrante, néroli royal et muscs blancs soyeux.',
      filterQuery: 'neroli',
      creations: ['Diffuseur Néroli Impérial & Cédrat', 'Brume d\'Ambiance Fleur de Coton']
    },
    {
      title: 'Gourmand & Épicé',
      icon: Coffee,
      subtitle: 'Sensualité gourmande & fève de cacao',
      description: 'Une invitation au voyage intérieur avec des accents de fève tonka torréfiée, de cannelle précieuse et de fève de cacao pur.',
      filterQuery: 'cacao',
      creations: ['Bougie Santal & Cacao Pur', 'Coffret Dégustation Olfactive']
    }
  ];

  const current = families[activeFamily];
  const IconComponent = current.icon;

  return (
    <section className="py-20 bg-[#faf8f5] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] text-amber-800 font-semibold">
            Le Guide Olfactif
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
            Trouvez la Senteur de Votre Intérieur
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm">
            Chaque pièce de votre maison a sa personnalité. Choisissez l'accord parfait.
          </p>
        </div>

        {/* Family Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {families.map((f, idx) => {
            const Icon = f.icon;
            const isSelected = activeFamily === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveFamily(idx)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white border-amber-800 shadow-md ring-1 ring-amber-800/30'
                    : 'bg-stone-50/70 border-stone-200 hover:bg-white'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-amber-800' : 'text-stone-400'}`} />
                <h4 className={`font-serif text-sm font-semibold ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>
                  {f.title}
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                  {f.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Selected Family Spotlight */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold">
              <IconComponent className="w-3.5 h-3.5 text-amber-700" />
              <span>Accord Signature : {current.title}</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-900">
              {current.subtitle}
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              {current.description}
            </p>
            <div className="pt-2">
              <p className="text-xs font-semibold text-stone-800 mb-1">Créations emblématiques :</p>
              <div className="flex flex-wrap gap-2">
                {current.creations.map((item, i) => (
                  <span key={i} className="text-xs bg-stone-100 px-3 py-1 rounded-full text-stone-700 font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              onClick={() => onSelectScentFilter(current.filterQuery)}
              className="w-full md:w-auto px-6 py-3.5 bg-[#262220] hover:bg-amber-800 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors shadow-sm"
            >
              Voir les créations de cet univers
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
