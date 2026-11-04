import React, { useState } from 'react';
import { X, Sparkles, Image, Check, Upload, Loader2, AlertCircle, CheckCircle, Trash2, Star } from 'lucide-react';
import { Product, CategorySlug } from '../../types';
import { useStore } from '../../context/StoreContext';
import { uploadImageToStorage } from '../../services/firebase';
import { compressImage } from '../../utils/imageCompressor';

interface AdminProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
}

const MAX_IMAGES_COUNT = 4;
const MAX_FILE_SIZE_MB = 5;

export const AdminProductForm: React.FC<AdminProductFormProps> = ({
  product,
  onClose,
  onSave
}) => {
  const { categories } = useStore();

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState<CategorySlug>(product?.category || (categories[0]?.slug as CategorySlug) || '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice ? String(product.originalPrice) : '');
  const [stock, setStock] = useState(product ? String(product.stock) : '0');
  const [sku, setSku] = useState(product?.sku || '');
  const [tagline, setTagline] = useState(product?.tagline || '');
  const [description, setDescription] = useState(product?.description || '');
  
  // Multiple images with condition (Max 4 images)
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [manualImageUrl, setManualImageUrl] = useState('');

  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);
  const [isBestseller, setIsBestseller] = useState(product?.isBestseller || false);
  const [isNewArrival, setIsNewArrival] = useState(product?.isNewArrival || false);

  // Storage compression and upload states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Condition sur le nombre maximal d'images (max 4)
    if (images.length >= MAX_IMAGES_COUNT) {
      setUploadError(`Limite atteinte : Vous ne pouvez pas ajouter plus de ${MAX_IMAGES_COUNT} images par produit.`);
      return;
    }

    setUploadError(null);
    setIsProcessing(true);
    setProcessStep("Optimisation de l'image...");
    setUploadProgress(20);

    try {
      // Allègement immédiat par Canvas (WebP/JPEG < 100ms)
      const compressed = await compressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.80,
        maxFileSizeMB: MAX_FILE_SIZE_MB
      });

      setProcessStep("Téléversement rapide...");
      setUploadProgress(60);

      // Téléversement ultra-rapide avec secours instantané
      const downloadUrl = await uploadImageToStorage(
        compressed.file,
        'products',
        (pct) => setUploadProgress(pct),
      );

      setImages(prev => [...prev, downloadUrl]);
      setProcessStep("Image ajoutée !");
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(err.message || "Erreur lors de l'ajout de l'image.");
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleAddManualUrl = () => {
    if (!manualImageUrl.trim()) return;
    if (images.length >= MAX_IMAGES_COUNT) {
      setUploadError(`Limite atteinte : Maximum ${MAX_IMAGES_COUNT} images autorisées.`);
      return;
    }
    try {
      const url = new URL(manualImageUrl.trim());
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
    } catch {
      setUploadError('Utilisez une URL HTTP(S) ou importez une image dans Firebase Storage.');
      return;
    }
    setImages(prev => [...prev, manualImageUrl.trim()]);
    setManualImageUrl('');
    setUploadError(null);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (images.length <= 1) {
      setUploadError("Un produit doit comporter au moins 1 image de présentation.");
      return;
    }
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setUploadError(null);
  };

  const handleSetCoverImage = (indexToPromote: number) => {
    if (indexToPromote === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const [promoted] = copy.splice(indexToPromote, 1);
      return [promoted, ...copy];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setSubmitError('Au moins une image est requise pour créer le produit.');
      return;
    }
    if (!categories.some(item => item.slug === category)) {
      setSubmitError('Créez ou sélectionnez une catégorie réelle avant le produit.');
      return;
    }
    if (!Number.isFinite(Number(price)) || Number(price) <= 0 ||
        !Number.isSafeInteger(Number(stock)) || Number(stock) < 0) {
      setSubmitError('Saisissez un prix positif et un stock entier valide.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const catObj = categories.find(c => c.slug === category);
    
    const payload: any = {
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      categoryName: catObj!.name,
      price: Number(price),
      stock: Number(stock),
      sku: sku.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      images,
      isFeatured,
      isBestseller,
      isNewArrival,
      details: product?.details || [],
      careGuide: product?.careGuide || [],
      updatedAt: new Date().toISOString()
    };

    if (originalPrice && Number(originalPrice) > 0) {
      payload.originalPrice = Number(originalPrice);
    }

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setSubmitError(err.message || 'Erreur lors de l\'enregistrement dans Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" onClick={onClose} />
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4">
        <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
          
          <div className="p-4 sm:p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
            <h3 className="font-serif text-base sm:text-lg font-semibold text-stone-900">
              {product ? 'Modifier la Création (Cloud Firestore)' : 'Nouvelle Création au Catalogue'}
            </h3>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
            
            <div>
              <label className="font-medium text-stone-700 block mb-1">Nom du Produit *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bougie Ébène & Jasmin de Nuit"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Catégorie *</label>
                <select
                  value={category}
                  required
                  onChange={(e) => setCategory(e.target.value as CategorySlug)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700 cursor-pointer"
                >
                  {categories.length === 0 && <option value="">Créez une catégorie d’abord</option>}
                  {categories.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Référence SKU *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-stone-700 block mb-1">Prix (FCFA) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Ancien Prix</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="Optionnel"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700 block mb-1">Stock Réel *</label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-stone-700 block mb-1">Sillage / Sous-titre *</label>
              <input
                type="text"
                required
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ex: Ambre précieux, vanille bourbon et bois fumé"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-medium text-stone-700 block mb-1">Description Détaillée</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez les matières, la confection et l'expérience sensorielle..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl"
              />
            </div>

            {/* Images Management Section with Strict Conditions & Fast Compression */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-semibold text-stone-800">
                    Galerie Photos du Produit
                  </label>
                  <p className="text-[10px] text-stone-500">
                    La première image sert d'affiche principale.
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  images.length >= MAX_IMAGES_COUNT
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {images.length} / {MAX_IMAGES_COUNT} images • Max {MAX_FILE_SIZE_MB} Mo
                </span>
              </div>

              {/* Thumbnails Gallery */}
              <div className="grid grid-cols-4 gap-2.5">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-stone-200 bg-white aspect-square flex items-center justify-center shadow-2xs"
                  >
                    <img
                      src={img}
                      alt={`Vue ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badge Cover */}
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 bg-amber-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                        Couverture
                      </span>
                    )}

                    {/* Actions overlay */}
                    <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetCoverImage(idx)}
                          className="p-1.5 bg-white text-amber-800 rounded-lg hover:bg-amber-50 cursor-pointer"
                          title="Définir comme image principale"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-700" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Supprimer cette image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Slot to add image if < MAX_IMAGES_COUNT */}
                {images.length < MAX_IMAGES_COUNT && (
                  <label className="border-2 border-dashed border-stone-300 hover:border-amber-800 rounded-xl aspect-square flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-colors bg-white/60 hover:bg-amber-50/50">
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-800" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-stone-500 mb-1" />
                        <span className="text-[10px] font-medium text-stone-700">
                          + Ajouter
                        </span>
                        <span className="text-[9px] text-stone-400">
                          ≤ {MAX_FILE_SIZE_MB} Mo
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Progress and status */}
              {isProcessing && (
                <div className="space-y-1 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <div className="flex justify-between text-[11px] text-amber-900 font-medium">
                    <span>{processStep}</span>
                    {uploadProgress > 0 && <span>{uploadProgress}%</span>}
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-700 h-1.5 transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Add image by URL if desired */}
              {images.length < MAX_IMAGES_COUNT && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Ou coller une URL d'image directe..."
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    className="flex-1 p-2 bg-white border border-stone-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualUrl}
                    className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-medium cursor-pointer"
                  >
                    Ajouter URL
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-amber-800"
                />
                <span>Mis en avant</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="rounded text-amber-800"
                />
                <span>Bestseller</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => setIsNewArrival(e.target.checked)}
                  className="rounded text-amber-800"
                />
                <span>Nouveauté</span>
              </label>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 hover:bg-stone-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isProcessing}
                className="px-5 py-2 bg-amber-800 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{product ? 'Sauvegarder dans Firestore' : 'Ajouter le Produit'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
