import { Category, Product, PromoCode, Order } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'cat-bougies',
    slug: 'bougies',
    name: 'Bougies Parfumées',
    description: 'Cire végétale de soja, mèches en coton pur et essences rares.',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
    itemCount: 8,
  },
  {
    id: 'cat-diffuseurs',
    slug: 'diffuseurs',
    name: 'Diffuseurs & Senteurs',
    description: 'Bâtonnets en rotin naturel et brumes d\'ambiance aux sillages enveloppants.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    itemCount: 6,
  },
  {
    id: 'cat-vases',
    slug: 'vases',
    name: 'Vases & Céramiques',
    description: 'Lignes épurées, grès chamotté et teintes naturelles terracotta et sable.',
    image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
    itemCount: 7,
  },
  {
    id: 'cat-decoration',
    slug: 'decoration',
    name: 'Décoration & Art de Vivre',
    description: 'Plateaux en marbre travertin, bougeoirs dorés et accents sculpturaux.',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    itemCount: 6,
  },
  {
    id: 'cat-coffrets',
    slug: 'coffrets',
    name: 'Coffrets Cadeaux',
    description: 'Assortiments exclusifs présentés dans nos boîtes écrin ZStore dorées à chaud.',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    itemCount: 5,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Bougie "Coucher de Soleil sur Ouidah"',
    slug: 'bougie-coucher-soleil-ouidah',
    category: 'bougies',
    categoryName: 'Bougies Parfumées',
    price: 18500,
    originalPrice: 22000,
    rating: 4.9,
    reviewCount: 38,
    stock: 15,
    sku: 'ZS-BOU-001',
    images: [
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1572726729437-373264b7f035?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1000&q=85',
    ],
    isFeatured: true,
    isBestseller: true,
    isNewArrival: false,
    tagline: 'Ambre chaud, vanille bourbon et écorce de cèdre fumé',
    description: 'Inspirée par la douceur dorée des fins d\'après-midi sur la côte atlantique béninoise. Coulée à la main avec une cire 100% soja végétale et une mèche double en coton bio tressé.',
    details: [
      'Cire 100% végétale de soja (sans OGM ni paraffine)',
      'Parfum formulé à Grasse en exclusivité pour ZStore',
      'Pot en céramique émaillée fait main réutilisable',
      'Temps de combustion : ~55 heures (280g)'
    ],
    burnTime: '55 heures',
    weight: '280g',
    dimensions: 'Ø 8.5 cm x H 10 cm',
    materials: ['Cire végétale de soja', 'Grès émaillé', 'Mèche coton'],
    olfactoryPyramid: {
      topNotes: ['Bergamote douce', 'Zeste d\'orange amère'],
      heartNotes: ['Ambre solaire', 'Vanille Bourbon de Madagascar'],
      baseNotes: ['Bois de cèdre de l\'Atlas', 'Patchouli noir']
    },
    careGuide: [
      'Laissez brûler la bougie 2 heures lors du premier allumage pour éviter le creusement.',
      'Coupez la mèche à environ 5 mm avant chaque allumage.',
      'Ne laissez jamais une bougie allumée sans surveillance.'
    ],
    reviews: [
      {
        id: 'rev-1',
        authorName: 'Amina K.',
        city: 'Cotonou (Haie Vive)',
        rating: 5,
        date: '24 Octobre 2026',
        comment: 'Le parfum est incroyable, subtil mais embaume tout mon salon sans être entêtant. Le pot en céramique est magnifique !',
        verifiedPurchase: true
      },
      {
        id: 'rev-2',
        authorName: 'Jean-Marc D.',
        city: 'Abomey-Calavi',
        rating: 5,
        date: '12 Octobre 2026',
        comment: 'Livraison express reçue en moins de 3h à Calavi. Emballage impeccable avec le ruban satin.',
        verifiedPurchase: true
      }
    ],
    isDemo: true
  },
  {
    id: 'prod-2',
    name: 'Diffuseur de Parfum "Néroli Impérial & Cédrat"',
    slug: 'diffuseur-neroli-imperial',
    category: 'diffuseurs',
    categoryName: 'Diffuseurs & Senteurs',
    price: 24000,
    rating: 4.8,
    reviewCount: 24,
    stock: 12,
    sku: 'ZS-DIF-002',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=1000&q=85'
    ],
    isFeatured: true,
    isBestseller: true,
    tagline: 'Fleur d\'oranger lumineuse, musc blanc et agrumes gorgés de soleil',
    description: 'Une diffusion continue et raffinée pour votre chambre ou hall d\'entrée. Flacon en verre lourd teinté ambre avec 8 tiges en rotin naturel non traité.',
    details: [
      'Contenance : 200 ml (~3 à 4 mois de diffusion)',
      'Formule sans alcool synthétique agressif',
      'Flacon sérigraphié en verre ambré recyclable',
      'Comprend 8 bâtonnets en rotin de 25 cm'
    ],
    capacity: '200 ml',
    dimensions: 'Ø 7 cm x H 13 cm',
    materials: ['Verre soufflé ambré', 'Rotin naturel'],
    olfactoryPyramid: {
      topNotes: ['Fleur d\'oranger', 'Cédrat de Calabre'],
      heartNotes: ['Néroli précieux', 'Jasmin sambac'],
      baseNotes: ['Musc blanc poudré', 'Bois blanc flotté']
    },
    careGuide: [
      'Retournez les tiges 1 fois par semaine pour raviver la diffusion.',
      'Placez à l\'abri des courants d\'air trop forts pour prolonger la durée.'
    ],
    reviews: [
      {
        id: 'rev-3',
        authorName: 'Mireille B.',
        city: 'Cotonou (Cadjehoun)',
        rating: 5,
        date: '28 Octobre 2026',
        comment: 'Fraîcheur absolue dans mon bureau. Tous mes invités demandent quelle est cette senteur !',
        verifiedPurchase: true
      }
    ],
    isDemo: true
  },
  {
    id: 'prod-3',
    name: 'Vase Cannelé "Terracotta d\'Artiste"',
    slug: 'vase-cannele-terracotta',
    category: 'vases',
    categoryName: 'Vases & Céramiques',
    price: 32000,
    originalPrice: 38000,
    rating: 5.0,
    reviewCount: 19,
    stock: 7,
    sku: 'ZS-VAS-003',
    images: [
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=1000&q=85'
    ],
    isFeatured: true,
    isNewArrival: true,
    tagline: 'Grès chamotté façonné artisanalement aux textures minérales',
    description: 'Une pièce maîtresse sculpturale aux cannelures organiques. Idéal pour mettre en valeur des tiges de graminées séchées, du feuillage d\'eucalyptus ou à poser nu comme objet d\'art contemporain.',
    details: [
      'Grès naturel cuit à haute température',
      'Finition mate texturée au toucher soyeux',
      'Étanche pour fleurs fraîches ou composition séchée',
      'Fait à la main, chaque pièce possède ses légères singularités'
    ],
    dimensions: 'H 26 cm x L 18 cm x Col 7 cm',
    weight: '1.4 kg',
    materials: ['Terre cuite chamottée', 'Engobe naturel mat'],
    careGuide: [
      'Nettoyer délicatement à l\'eau tiède avec un chiffon microfibre.',
      'Ne pas passer au lave-vaisselle.'
    ],
    reviews: [
      {
        id: 'rev-4',
        authorName: 'Séraphin V.',
        city: 'Porto-Novo',
        rating: 5,
        date: '18 Octobre 2026',
        comment: 'La texture et la couleur terracotta sont exactement conformes aux photos. Magnifique sur ma table en teck.',
        verifiedPurchase: true
      }
    ],
    isDemo: true
  },
  {
    id: 'prod-4',
    name: 'Plateau Sculptural en Travertin & Laiton',
    slug: 'plateau-travertin-laiton',
    category: 'decoration',
    categoryName: 'Décoration & Art de Vivre',
    price: 28500,
    rating: 4.9,
    reviewCount: 15,
    stock: 9,
    sku: 'ZS-DEC-004',
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=1000&q=85'
    ],
    isFeatured: true,
    isBestseller: false,
    tagline: 'Pierre calcaire naturelle veinée avec poignées en laiton massif brossé',
    description: 'Le plateau parfait pour mettre en scène vos bougies, flacons de parfums ou bijoux de chevet. Le travertin brut apporte une chaleur minérale intemporelle à tout intérieur moderne.',
    details: [
      'Travertin naturel véritable taillé dans la masse',
      'Poignées géométriques en laiton doré brossé satiné',
      'Pieds en feutrine sous la base pour protéger vos meubles',
      'Poids substantiel garantissant une parfaite stabilité'
    ],
    dimensions: '30 cm x 20 cm x Epaisseur 2 cm',
    weight: '2.1 kg',
    materials: ['Travertin naturel beige', 'Laiton brossé'],
    careGuide: [
      'Éviter le contact prolongé avec des liquides acides (citron, vinaigre).',
      'Essuyer avec un chiffon doux légèrement humide.'
    ],
    reviews: [],
    isDemo: true
  },
  {
    id: 'prod-5',
    name: 'Coffret Écrin "Sérénité d\'Intérieur" Signature',
    slug: 'coffret-serenite-interieur',
    category: 'coffrets',
    categoryName: 'Coffrets Cadeaux',
    price: 49000,
    originalPrice: 56000,
    rating: 5.0,
    reviewCount: 42,
    stock: 8,
    sku: 'ZS-COF-005',
    images: [
      'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=85'
    ],
    isFeatured: true,
    isBestseller: true,
    isNewArrival: false,
    tagline: '1 Bougie 280g + 1 Diffuseur 200ml + 1 Coupe-mèche en laiton doré',
    description: 'Le cadeau de prestige par excellence pour emménagement, anniversaire ou remerciements. Présenté dans notre coffret rigide noir mat texturé avec ruban gros-grain terracotta et dorure à chaud.',
    details: [
      '1x Bougie parfumée Coucher de Soleil sur Ouidah (280g)',
      '1x Diffuseur d\'ambiance Néroli Impérial (200ml) avec ses 8 bâtonnets',
      '1x Coupe-mèche professionnel en laiton doré gravé ZStore',
      '1x Carte de vœux calligraphiée personnalisable incluse'
    ],
    dimensions: 'Coffret 32 x 25 x 12 cm',
    materials: ['Coffret rigide FSC luxe', 'Céramique', 'Laiton', 'Verre ambré'],
    careGuide: [
      'Conserver à température ambiante à l\'abri du soleil direct avant d\'offrir.'
    ],
    reviews: [
      {
        id: 'rev-5',
        authorName: 'Danielle T.',
        city: 'Cotonou (Fidjrossè)',
        rating: 5,
        date: '1 Novembre 2026',
        comment: 'Offert pour l\'anniversaire de ma sœur. L\'emballage est digne des plus grandes maisons de luxe parisiennes !',
        verifiedPurchase: true
      }
    ],
    isDemo: true
  },
  {
    id: 'prod-6',
    name: 'Bougie "Brume de Santal & Cacao Pur"',
    slug: 'bougie-santal-cacao-pur',
    category: 'bougies',
    categoryName: 'Bougies Parfumées',
    price: 19500,
    rating: 4.8,
    reviewCount: 18,
    stock: 10,
    sku: 'ZS-BOU-006',
    images: [
      'https://images.unsplash.com/photo-1572726729437-373264b7f035?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1000&q=85'
    ],
    isFeatured: false,
    isNewArrival: true,
    tagline: 'Notes boisées enveloppantes, fève tonka torréfiée et musc soyeux',
    description: 'Une alliance gourmande et sophistiquée rappelant les arômes précieux de fèves de cacao et de bois noble. Idéale pour les soirées feutrées et apaisantes.',
    details: [
      'Cire 100% soja coulée artisanalement',
      'Mèche en bois de cerisier crépitant doucement à l\'allumage',
      'Verre fumé noir mat luxueux',
      'Combustion propre sans fumée noire'
    ],
    burnTime: '50 heures',
    weight: '260g',
    materials: ['Cire végétale', 'Verre fumé', 'Mèche bois crépitante'],
    olfactoryPyramid: {
      topNotes: ['Fève de cacao torréfiée', 'Écorce de cannelle'],
      heartNotes: ['Santal de Mysore', 'Gousse de tonka'],
      baseNotes: ['Musc ambré', 'Résine de benjoin']
    },
    reviews: [],
    isDemo: true
  },
  {
    id: 'prod-7',
    name: 'Vase Céramique Sculpturale "Alba"',
    slug: 'vase-sculpturale-alba',
    category: 'vases',
    categoryName: 'Vases & Céramiques',
    price: 36000,
    rating: 4.9,
    reviewCount: 11,
    stock: 4,
    sku: 'ZS-VAS-007',
    images: [
      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=85'
    ],
    isFeatured: false,
    isBestseller: false,
    tagline: 'Silhouette asymétrique contemporaine en grès blanc sable texturé',
    description: 'Une véritable œuvre d\'art géométrique pour les passionnés de design d\'intérieur. Évoque la douceur des dunes de Grand-Popo et la pureté des lignes minimalistes scandinaves-africaines.',
    details: [
      'Forme en arche évidée asymétrique',
      'Finition grès sable blanc finement grainé',
      'Pièce d\'exception en série limitée'
    ],
    dimensions: 'H 30 cm x L 22 cm x Ep 8 cm',
    weight: '1.8 kg',
    materials: ['Grès blanc naturel chamotté'],
    reviews: [],
    isDemo: true
  },
  {
    id: 'prod-8',
    name: 'Duo de Bougeoirs en Fer Forgé & Finition Laiton',
    slug: 'duo-bougeoirs-fer-forge-laiton',
    category: 'decoration',
    categoryName: 'Décoration & Art de Vivre',
    price: 22000,
    rating: 4.7,
    reviewCount: 9,
    stock: 14,
    sku: 'ZS-DEC-008',
    images: [
      'https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=85'
    ],
    isFeatured: false,
    tagline: 'Deux hauteurs complémentaires pour chandelier flambeaux élégant',
    description: 'Conçus par un atelier de ferronnerie d\'art, ces deux bougeoirs apportent du relief et une élégance chaleureuse à votre centre de table.',
    details: [
      'Ensemble de 2 bougeoirs (Hauteurs : 24 cm et 19 cm)',
      'Compatible avec toutes chandelles de diamètre standard (2.2 cm)',
      'Base lourde anti-basculement'
    ],
    materials: ['Fer forgé', 'Patiné laiton chaud'],
    reviews: [],
    isDemo: true
  }
];

export const INITIAL_PROMOS: PromoCode[] = [
  {
    code: 'BIENVENUE10',
    discountPercent: 10,
    minOrderAmount: 20000,
    description: '10% de réduction sur votre première commande dès 20 000 FCFA',
    isActive: true,
  },
  {
    code: 'HARMONIE5000',
    discountAmount: 5000,
    minOrderAmount: 40000,
    description: '5 000 FCFA offerts dès 40 000 FCFA d\'achats',
    isActive: true,
  },
  {
    code: 'HARMONIE',
    discountPercent: 15,
    minOrderAmount: 50000,
    description: '15% de remise sur la collection Harmonie & Coffrets',
    isActive: true,
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ZS-BN-2026-8941',
    date: '2026-11-02T14:32:00.000Z',
    userId: 'client-101',
    items: [
      {
        product: INITIAL_PRODUCTS[0],
        quantity: 2
      },
      {
        product: INITIAL_PRODUCTS[3],
        quantity: 1
      }
    ],
    subtotal: 65500,
    deliveryFee: 0,
    discount: 5000,
    appliedPromo: 'HARMONIE5000',
    total: 60500,
    deliveryDetails: {
      fullName: 'Béatrice Mensah',
      phone: '+229 97 12 34 56',
      email: 'beatrice.mensah@example.com',
      city: 'Cotonou',
      district: 'Haie Vive (Rue des Ambassades)',
      addressDetails: 'Villa 14, portail marron en face de la pâtisserie',
      deliveryOption: 'express',
      giftWrapping: true,
      giftMessage: 'Joyeuse crémaillère à vous !'
    },
    status: 'en_livraison',
    paymentMethod: 'paiement_livraison',
    isPaid: true,
    timeline: [
      { status: 'en_attente', timestamp: '2026-11-02 14:32', note: 'Commande validée par la cliente' },
      { status: 'en_preparation', timestamp: '2026-11-02 15:10', note: 'Préparation et emballage cadeau soigné' },
      { status: 'en_livraison', timestamp: '2026-11-02 16:45', note: 'En cours d\'acheminement par le coursier ZStore Express' }
    ],
    isDemo: true
  },
  {
    id: 'ord-102',
    orderNumber: 'ZS-BN-2026-8942',
    date: '2026-11-01T10:15:00.000Z',
    userId: 'client-102',
    items: [
      {
        product: INITIAL_PRODUCTS[4],
        quantity: 1
      }
    ],
    subtotal: 49000,
    deliveryFee: 2000,
    discount: 0,
    total: 51000,
    deliveryDetails: {
      fullName: 'Arsène Dossou',
      phone: '+229 95 98 76 54',
      email: 'arsene.d@example.com',
      city: 'Abomey-Calavi',
      district: 'Arconville',
      addressDetails: 'Carrefour IITA, 2ème rue à gauche',
      deliveryOption: 'standard',
      giftWrapping: true
    },
    status: 'livree',
    paymentMethod: 'paiement_livraison',
    isPaid: true,
    timeline: [
      { status: 'en_attente', timestamp: '2026-11-01 10:15', note: 'Commande reçue' },
      { status: 'en_preparation', timestamp: '2026-11-01 11:30', note: 'Colis préparé' },
      { status: 'en_livraison', timestamp: '2026-11-01 14:00', note: 'Prise en charge livreur Calavi' },
      { status: 'livree', timestamp: '2026-11-01 15:20', note: 'Colis remis en main propre, paiement réglé' }
    ],
    isDemo: true
  }
];
