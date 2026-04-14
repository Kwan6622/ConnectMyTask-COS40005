function getCloudinaryConfig() {
  const cloudName =
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    process.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const uploadEndpoint =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_ENDPOINT ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_ENDPOINT ||
    process.env.VITE_CLOUDINARY_UPLOAD_ENDPOINT ||
    (cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` : "");

  if (!cloudName || !uploadPreset || !uploadEndpoint) {
    throw new Error(
      "Missing Cloudinary config. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }

  return { cloudName, uploadPreset, uploadEndpoint };
}

export interface UploadableImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export async function uploadImageToCloudinary(asset: UploadableImageAsset): Promise<string> {
  const { cloudName, uploadPreset, uploadEndpoint } = getCloudinaryConfig();
  const formData = new FormData();

  formData.append("file", {
    uri: asset.uri,
    type: asset.mimeType || "image/jpeg",
    name: asset.fileName || `upload-${Date.now()}.jpg`,
  } as any);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(uploadEndpoint, {
    method: "POST",
    body: formData,
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const cloudinaryMessage = body?.error?.message || body?.message || "Cloudinary upload failed.";
    throw new Error(`${cloudinaryMessage} (cloud: ${cloudName}, preset: ${uploadPreset})`);
  }

  if (!body?.secure_url) {
    throw new Error("Cloudinary did not return secure_url.");
  }

  return String(body.secure_url);
}
