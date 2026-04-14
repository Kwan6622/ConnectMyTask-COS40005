/**
 * Read Cloudinary config from env.
 * We intentionally avoid silent hardcoded cloud values so config mistakes are obvious.
 */
function getCloudinaryConfig() {
  const cloudName =
    import.meta.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    import.meta.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const uploadEndpoint =
    import.meta.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_ENDPOINT ||
    import.meta.env.VITE_CLOUDINARY_UPLOAD_ENDPOINT ||
    (cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` : '');

  if (!cloudName || !uploadPreset || !uploadEndpoint) {
    throw new Error(
      'Missing Cloudinary config. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.'
    );
  }

  return { cloudName, uploadPreset, uploadEndpoint };
}

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const { cloudName, uploadPreset, uploadEndpoint } = getCloudinaryConfig();
  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    body: formData,
  });
  const body = await response.json();
  if (!response.ok) {
    const cloudinaryMessage =
      body?.error?.message || body?.message || 'Cloudinary upload failed.';
    throw new Error(`${cloudinaryMessage} (cloud: ${cloudName}, preset: ${uploadPreset})`);
  }
  if (!body?.secure_url) {
    throw new Error('Cloudinary did not return secure_url.');
  }

  return body.secure_url as string;
}
