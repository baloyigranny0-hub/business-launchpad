/** Client-side screenshot redaction helpers — nothing leaves the browser un-masked. */

export interface RedactBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const MAX_EDGE = 1600;

export async function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("That image could not be read."));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

/**
 * Re-encodes the screenshot (dropping any embedded metadata), scales it down and
 * paints solid blocks over every area the founder marked as sensitive.
 * Boxes are given in 0..1 relative coordinates.
 */
export function redactToDataUrl(img: HTMLImageElement, boxes: RedactBox[]): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process that image.");
  ctx.drawImage(img, 0, 0, w, h);

  for (const box of boxes) {
    const bx = box.x * w;
    const by = box.y * h;
    const bw = box.w * w;
    const bh = box.h * h;
    ctx.fillStyle = "#111111";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#ff4d4d";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
  }

  return canvas.toDataURL("image/jpeg", 0.82);
}

/** Bands commonly holding credentials/ID/bank fields, offered as one-tap masks. */
export function quickMaskPresets(): { label: string; box: RedactBox }[] {
  return [
    { label: "Mask top bar (login / profile)", box: { x: 0, y: 0, w: 1, h: 0.08 } },
    { label: "Mask left panel", box: { x: 0, y: 0.08, w: 0.28, h: 0.92 } },
    { label: "Mask bottom strip", box: { x: 0, y: 0.9, w: 1, h: 0.1 } },
  ];
}
