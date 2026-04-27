import { apiClient } from './client';

export interface CloudinarySignature {
  timestamp: number;
  signature: string;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export async function getUploadSignature(folder: string = 'properties'): Promise<CloudinarySignature> {
  const data = await apiClient<{
    timestamp: number;
    signature: string;
    cloudName: string;
    apiKey: string;
    folder: string;
  }>(`/users/upload/signature?folder=${encodeURIComponent(folder)}`);
  return data;
}

export async function uploadToCloudinaryBrowser(
  file: File,
  signatureData: CloudinarySignature,
  onProgress?: (progress: number) => void
): Promise<{ url: string; public_id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', String(signatureData.timestamp));
  formData.append('signature', signatureData.signature);
  formData.append('folder', signatureData.folder);

  const isVideo = file.type.startsWith('video/');
  const resourceType = isVideo ? 'video' : 'image';
  
  const uploadUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url,
            public_id: response.public_id,
          });
        } catch (err) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || 'Upload failed'));
        } catch (err) {
          reject(new Error('Upload failed'));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
}
