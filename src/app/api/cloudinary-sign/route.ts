import { getCloudinaryImageConfig, signCloudinaryUpload } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
  const config = getCloudinaryImageConfig();
  if (!config) {
    return Response.json(
      {
        error:
          "Chưa cấu hình kho ảnh Cloudinary. Thêm CLOUDINARY_IMAGE_CLOUD_NAME, CLOUDINARY_IMAGE_API_KEY, CLOUDINARY_IMAGE_API_SECRET, CLOUDINARY_IMAGE_FOLDER vào .env",
      },
      { status: 503 },
    );
  }

  return Response.json(signCloudinaryUpload(config));
}
