// Client-side image normalization. Real perspective auto-crop is out of scope
// for v1, so we gracefully fall back to the original photo — but we DO downscale
// large camera images and re-encode as JPEG to keep the vision payload small
// and fast. Runs in the browser only.

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

export async function fileToNormalizedDataUrl(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  try {
    return await downscale(dataUrl);
  } catch {
    // If canvas work fails for any reason, the original still works.
    return dataUrl;
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.readAsDataURL(file);
  });
}

function downscale(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
      if (scale >= 1) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error("Could not decode the photo."));
    img.src = dataUrl;
  });
}
