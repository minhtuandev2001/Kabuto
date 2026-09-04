const MAX_EDGE = 1280;
const SKIP_COMPRESS_BYTES = 1_200_000;

async function prepareVocabImage(file: File): Promise<Blob> {
  const looksHeic = /heic|heif/i.test(`${file.type} ${file.name}`);
  if (file.size <= SKIP_COMPRESS_BYTES && file.type.startsWith("image/") && !looksHeic) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const keepAlpha = file.type === "image/png" || file.type === "image/webp";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, keepAlpha ? "image/png" : "image/jpeg", 0.86),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

type SignResponse = {
  apiKey?: string;
  cloudName?: string;
  folder?: string;
  signature?: string;
  timestamp?: number;
  error?: string;
};

export async function uploadVocabImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/") && !/heic|heif/i.test(file.name)) {
    throw new Error("Chọn một file ảnh");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Ảnh tối đa 10MB");
  }

  const prepared = await prepareVocabImage(file);
  const signRes = await fetch("/api/cloudinary-sign", { method: "POST" });
  const sign = (await signRes.json()) as SignResponse;
  if (!signRes.ok || !sign.apiKey || !sign.cloudName || !sign.folder || !sign.signature || sign.timestamp == null) {
    throw new Error(sign.error || "Không lấy được chữ ký Cloudinary");
  }

  const body = new FormData();
  body.append("file", prepared, file.name || "vocab.jpg");
  body.append("api_key", sign.apiKey);
  body.append("timestamp", String(sign.timestamp));
  body.append("signature", sign.signature);
  body.append("folder", sign.folder);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const uploaded = (await uploadRes.json()) as { secure_url?: string; error?: { message?: string } };
  if (!uploadRes.ok || !uploaded.secure_url) {
    throw new Error(uploaded.error?.message || "Không upload được ảnh lên Cloudinary");
  }
  return uploaded.secure_url;
}
