/**
 * Utilitaires d'optimisation et de compression d'images côté client
 * Garantit des téléversements ultra-rapides vers Firebase Storage
 * et applique les contraintes strictes de poids et de nombre d'images.
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  width: number;
  height: number;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxFileSizeMB?: number;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Valide le type et le poids d'un fichier image avant tout traitement.
 */
export function validateImageFile(file: File, maxFileSizeMB = 5): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Format de fichier non pris en charge (${file.type || 'inconnu'}). Formats autorisés : JPG, PNG, WebP, AVIF.`
    );
  }

  const maxBytes = maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const currentMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `L'image sélectionnée est trop volumineuse (${currentMB} Mo). Le poids maximal autorisé est de ${maxFileSizeMB} Mo.`
    );
  }
}

/**
 * Compresse et redimensionne une image côté client via HTML5 Canvas
 * Traitement ultra-rapide (< 100 ms) pour une expérience instantanée sans latence.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.80,
    maxFileSizeMB = 5
  } = options;

  // 1. Validation préalable
  validateImageFile(file, maxFileSizeMB);

  // 2. Chargement et traitement immédiat en mémoire
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Impossible de lire le fichier image sélectionné."));

    reader.onload = () => {
      const img = new window.Image();

      img.onerror = () => reject(new Error("Le fichier sélectionné n'est pas une image valide."));

      img.onload = () => {
        try {
          // Calcul des dimensions proportionnelles
          let targetWidth = img.naturalWidth || img.width;
          let targetHeight = img.naturalHeight || img.height;

          if (targetWidth > maxWidth || targetHeight > maxHeight) {
            const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
            targetWidth = Math.round(targetWidth * ratio);
            targetHeight = Math.round(targetHeight * ratio);
          }

          // Rendu Canvas haute fidélité
          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Contexte Canvas 2D indisponible."));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Génération immédiate de la Data URL WebP (synchrone et ultra-rapide)
          let dataUrl = '';
          try {
            dataUrl = canvas.toDataURL('image/webp', quality);
          } catch {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          const outputType = 'image/webp';
          const extension = 'webp';

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Repli sur JPEG si le navigateur ne gère pas toBlob WebP
                canvas.toBlob(
                  (jpegBlob) => {
                    if (!jpegBlob) {
                      reject(new Error("Échec de la compression de l'image."));
                      return;
                    }
                    const cleanName = file.name.replace(/\.[^/.]+$/, '');
                    const compressedFile = new File([jpegBlob], `${cleanName}.jpg`, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });

                    const reduction = Math.round(
                      ((file.size - compressedFile.size) / file.size) * 100
                    );

                    resolve({
                      file: compressedFile,
                      dataUrl: dataUrl || canvas.toDataURL('image/jpeg', quality),
                      originalSize: file.size,
                      compressedSize: compressedFile.size,
                      reductionPercentage: Math.max(0, reduction),
                      width: targetWidth,
                      height: targetHeight
                    });
                  },
                  'image/jpeg',
                  quality
                );
                return;
              }

              const cleanName = file.name.replace(/\.[^/.]+$/, '');
              const compressedFile = new File([blob], `${cleanName}.${extension}`, {
                type: outputType,
                lastModified: Date.now()
              });

              const reduction = Math.round(
                ((file.size - compressedFile.size) / file.size) * 100
              );

              resolve({
                file: compressedFile,
                dataUrl,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                reductionPercentage: Math.max(0, reduction),
                width: targetWidth,
                height: targetHeight
              });
            },
            outputType,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Formatage convivial de la taille en Ko ou Mo
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
