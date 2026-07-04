import { uploadPlayerImage } from './blob-storage.js';

export async function uploadPlayerImageFromBase64(
  slug: string,
  playerId: string,
  imageBase64: string,
  mimeType = 'image/jpeg',
) {
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1]! : imageBase64;
  const buffer = Buffer.from(base64Data, 'base64');
  const blob = new Blob([buffer], { type: mimeType });
  return uploadPlayerImage(slug, playerId, blob, extension);
}
