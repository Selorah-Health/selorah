export type PreparedImage = {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
};

const MAX_STORED_DIMENSION = 2000;
const JPEG_QUALITY = 0.86;

export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not open image'));
    image.src = dataUrl;
  });
}

/**
 * Downscale large phone photos before they are stored. Keeps records fast to
 * open and avoids blowing the Supabase storage or IndexedDB quota. The original
 * file can still be passed to OCR so small print is not lost.
 */
export async function prepareImageFile(file: File): Promise<PreparedImage> {
  const originalDataUrl = await readFileAsDataUrl(file);

  if (!file.type.startsWith('image/')) {
    return {
      dataUrl: originalDataUrl,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      width: 0,
      height: 0,
      size: file.size,
    };
  }

  try {
    const image = await loadImage(originalDataUrl);
    const scale = Math.min(1, MAX_STORED_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available');
    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const approxSize = Math.round((dataUrl.length * 3) / 4);
    const baseName = (file.name || 'scan').replace(/\.[^.]+$/, '') || 'scan';

    return {
      dataUrl,
      fileName: `${baseName}.jpg`,
      mimeType: 'image/jpeg',
      width,
      height,
      size: approxSize,
    };
  } catch {
    return {
      dataUrl: originalDataUrl,
      fileName: file.name || 'document',
      mimeType: file.type || 'application/octet-stream',
      width: 0,
      height: 0,
      size: file.size,
    };
  }
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
