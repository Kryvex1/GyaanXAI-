export const IMGBB_API_KEY = '4d0aaf60b998acf1d135b77a1ed57875';

export interface ImgbbUploadResult {
  url: string;
  displayUrl: string;
  thumbUrl?: string;
  deleteUrl?: string;
  title?: string;
}

/**
 * Uploads an image (File or base64 string) to ImgBB using the user's provided API key.
 */
export async function uploadToImgBB(
  imageSource: File | Blob | string,
  customName?: string
): Promise<ImgbbUploadResult> {
  const formData = new FormData();
  formData.append('key', IMGBB_API_KEY);

  if (typeof imageSource === 'string') {
    // If it's a base64 string or data URL, remove the prefix if present
    const base64Clean = imageSource.includes('base64,')
      ? imageSource.split('base64,')[1]
      : imageSource;
    formData.append('image', base64Clean);
  } else {
    formData.append('image', imageSource);
  }

  if (customName) {
    formData.append('name', customName);
  }

  const response = await fetch(`https://api.imgbb.com/1/upload`, {
    method: 'POST',
    body: formData,
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json?.error?.message || 'ImgBB upload failed.';
    throw new Error(errorMsg);
  }

  return {
    url: json.data.url,
    displayUrl: json.data.display_url,
    thumbUrl: json.data.thumb?.url || json.data.display_url,
    deleteUrl: json.data.delete_url,
    title: json.data.title,
  };
}
