/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Resizes an image file from user's filesystem and returns a compact base64 data URL.
 * Keeps payload light (~50-150KB) while maintaining crisp resolution for mobile & retina screens.
 */
export function compressImageFile(file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Pildi laadimine ebaõnnestus'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Faili lugemine ebaõnnestus'));
    reader.readAsDataURL(file);
  });
}
