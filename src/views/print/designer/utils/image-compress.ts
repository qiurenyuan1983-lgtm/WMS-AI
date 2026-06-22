function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    img.src = url;
  });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataUrl;
  });
}

function shouldUsePng(fileOrMime: string): boolean {
  const lower = fileOrMime.toLowerCase();
  return lower.includes('png') || lower.includes('gif') || lower.includes('webp');
}

/**
 * 将图片缩放并压缩到组件格尺寸（等比居中，不裁切）
 */
export async function compressImageForElement(
  file: File,
  width: number,
  height: number,
  quality = 0.85
): Promise<string> {
  const img = await loadImageFromFile(file);
  return renderImageToElementSize(img, width, height, shouldUsePng(file.type), quality);
}

/**
 * 将已有 dataUrl 重新压缩到新的组件格尺寸
 */
export async function compressImageDataUrlForElement(
  dataUrl: string,
  width: number,
  height: number,
  quality = 0.85
): Promise<string> {
  const img = await loadImageFromDataUrl(dataUrl);
  const usePng = dataUrl.startsWith('data:image/png') || dataUrl.startsWith('data:image/gif');
  return renderImageToElementSize(img, width, height, usePng, quality);
}

function renderImageToElementSize(
  img: HTMLImageElement,
  width: number,
  height: number,
  usePng: boolean,
  quality: number
): string {
  const maxW = Math.max(1, Math.round(width));
  const maxH = Math.max(1, Math.round(height));
  const naturalW = img.naturalWidth || img.width;
  const naturalH = img.naturalHeight || img.height;
  if (!naturalW || !naturalH) {
    throw new Error('无效的图片尺寸');
  }

  const scale = Math.min(maxW / naturalW, maxH / naturalH);
  const drawW = Math.max(1, Math.round(naturalW * scale));
  const drawH = Math.max(1, Math.round(naturalH * scale));
  const offsetX = Math.round((maxW - drawW) / 2);
  const offsetY = Math.round((maxH - drawH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = maxW;
  canvas.height = maxH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建画布');

  if (!usePng) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, maxW, maxH);
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

  if (usePng) {
    return canvas.toDataURL('image/png');
  }
  return canvas.toDataURL('image/jpeg', quality);
}
