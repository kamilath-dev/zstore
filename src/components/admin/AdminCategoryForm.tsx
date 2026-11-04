import React, { useState } from 'react';
import { X, Upload, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Category } from '../../types';
import { uploadImageToStorage } from '../../services/firebase';
import { compressImage } from '../../utils/imageCompressor';

interface AdminCategoryFormProps {
  category?: Category | null;
  onClose: () => void;
  onSave: (catData: Omit<Category, 'id'>) => Promise<void>;
}

export const AdminCategoryForm: React.FC<AdminCategoryFormProps> = ({
  category,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [description, setDescription] = useState(category?.description || '');
  const [imageUrl, setImageUrl] = useState(category?.image || '');

  // Compression & upload states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-generate slug from name if not manually modified
  const handleNameChange = (val: string) => {
    setName(val);
    if (!category) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessing(true);
    setProcessStep("Optimisation...");
    setUploadProgress(20);

    try {
      // Validation du poids (max 5 Mo) et compression client instantanée
      const compressed = await compressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.80,
        maxFileSizeMB: 5
      });

      setProcessStep("Téléversement rapide...");
      setUploadProgress(60);

      // Téléversement ultra-rapide avec repli immédiat sécurisé
      const downloadUrl = await uploadImageToStorage(
        compressed.file,
        'categories',
        (pct) => setUploadProgress(pct)
      );

      setImageUrl(downloadUrl);
      setProcessStep("Image prête !");
    } catch (err: any) {
      console.error('Category image upload error:', err);
      setUploadError(err.message || "Erreur lors de l'importation de l'image.");
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSubmitError('Le nom de la catégorie est obligatoire.');
      return;
    }
    if (!slug.trim()) {
      setSubmitError('Le slug identifiant est obligatoire.');
      return;
    }
    if (!imageUrl) {
      setSubmitError("Une image de couverture est obligatoire pour la catégorie.");
      return;
    }
    try {
      const url = new URL(imageUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
    } catch {
      setSubmitError('Utilisez une URL HTTP(S) ou importez une image dans Firebase Storage.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSave({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        image: imageUrl,
        itemCount: category?.itemCount || 0
      });
      onClose();
    } catch (err: any) {
      console.error('Error saving category:', err);
      setSubmitError(err.message || "Erreur lors de l'enregistrement de la catégorie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" onClick={onClose} />
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
          
          <div className="p-5 border-b border-stone-200 flex justify-between items-center bg-stone-50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-stone-900">
                {category ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            >
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
              <label className="font-medium text-stone-700 block mb-1">
                Nom de la Catégorie *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Diffuseurs de Parfum"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
              />
            </div>

            <div>
              <label className="font-medium text-stone-700 block mb-1">
                Slug URL unique *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Ex: diffuseurs-de-parfum"
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-none focus:border-amber-700"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Identifiant utilisé dans les filtres du catalogue.
              </span>
            </div>

            <div>
              <label className="font-medium text-stone-700 block mb-1">
                Description de la Catégorie
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Courte description valorisant les créations de cette catégorie..."
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-amber-700"
              />
            </div>

            {/* Image Upload with Conditions & Fast Compression */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-800">Image de Couverture</label>
                <span className="text-[10px] text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  1 image • Max 5 Mo • Allégée auto
                </span>
              </div>

              <div className="flex items-center gap-3">
                {imageUrl && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-stone-300 shrink-0 bg-stone-100">
                    <img
                      src={imageUrl}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl cursor-pointer transition-colors text-xs font-medium">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{processStep || 'Traitement...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importer l'image</span>
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

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-700 h-1.5 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-stone-500">
                    L'image est compressée et convertie en WebP haute fidélité dans votre navigateur avant l'envoi pour être ultra-légère.
                  </p>
                </div>
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] text-stone-500 block mb-0.5">
                  Ou URL directe :
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
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
                <span>{category ? 'Enregistrer les Modifications' : 'Créer la Catégorie'}</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
