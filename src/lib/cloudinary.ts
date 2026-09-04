import { createHash } from "crypto";

export type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

function normalizeFolder(raw: string | undefined) {
  const folder = (raw ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/{2,}/g, "/");
  if (!folder || folder.includes("..")) {
    return "";
  }
  return folder;
}

export function getCloudinaryImageConfig(): CloudinaryConfig | null {
  const folder = normalizeFolder(process.env.CLOUDINARY_IMAGE_FOLDER);
  let cloudName = "";
  let apiKey = "";
  let apiSecret = "";

  const fromUrl = process.env.CLOUDINARY_IMAGE_URL?.trim();
  if (fromUrl) {
    try {
      const parsed = new URL(fromUrl);
      cloudName = parsed.hostname;
      apiKey = decodeURIComponent(parsed.username);
      apiSecret = decodeURIComponent(parsed.password);
    } catch {
      // fall through to discrete env vars
    }
  }

  if (!cloudName || !apiKey || !apiSecret) {
    cloudName = process.env.CLOUDINARY_IMAGE_CLOUD_NAME?.trim() || "";
    apiKey = process.env.CLOUDINARY_IMAGE_API_KEY?.trim() || "";
    apiSecret = process.env.CLOUDINARY_IMAGE_API_SECRET?.trim() || "";
  }

  if (!cloudName || !apiKey || !apiSecret || !folder) {
    return null;
  }
  return { cloudName, apiKey, apiSecret, folder };
}

export function signCloudinaryUpload(config: CloudinaryConfig) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    folder: config.folder,
    timestamp,
  };
  const toSign = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signature = createHash("sha1")
    .update(`${toSign}${config.apiSecret}`)
    .digest("hex");

  return {
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    folder: config.folder,
    signature,
    timestamp,
  };
}
