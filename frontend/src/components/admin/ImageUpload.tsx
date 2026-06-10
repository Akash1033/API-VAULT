// Path: src/components/admin/ImageUpload.tsx
// Purpose: Drag-and-drop or click-to-browse image upload to backend
// Dependencies: react, react-dropzone, axios api instance

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '../../api/axios';

export interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label,
  aspectRatio = '16/9',
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getPaddingTop = () => {
    switch (aspectRatio) {
      case '16/9': return '56.25%';
      case '4/3': return '75%';
      case '1/1': return '100%';
      default: return '56.25%';
    }
  };

  async function uploadViaBackend(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    // Use the api axios instance so the request interceptor attaches
    // the current access token, and the response interceptor silently
    // refreshes it on 401 before retrying — no more "token expired" errors.
    const response = await api.post<{ data: { url: string } }>(
      '/upload/image',
      formData,
      {
        headers: {
          // Let axios/browser set the correct multipart boundary automatically
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data.url;
  }

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    setError(null);

    try {
      const url = await uploadViaBackend(file);
      onChange(url);
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.');
      setPreview(null);
      URL.revokeObjectURL(objectUrl);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    noClick: !!(value || preview), // Don't trigger file picker on click if image exists
  });

  const currentImage = preview || value;

  return (
    <div className="w-full">
      {label && (
        <label className="font-mono text-[11px] text-textMuted block mb-[4px]">
          {label}
        </label>
      )}

      <div
        {...getRootProps()}
        className="relative rounded-[6px] overflow-hidden cursor-pointer"
        style={{ paddingTop: getPaddingTop() }}
      >
        <input {...getInputProps()} />

        {!currentImage && !uploading && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center rounded-[6px] border-2 border-dashed transition-colors ${
              isDragActive
                ? 'border-green bg-[rgba(74,222,128,0.04)]'
                : 'border-border bg-bgRaised hover:border-borderHover'
            }`}
          >
            <svg
              className="w-[24px] h-[24px] text-textMuted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span className="font-sans text-[13px] text-textMuted mt-[8px]">
              Drop image here or click to browse
            </span>
            <span className="font-mono text-[10px] text-textMuted mt-[4px]">
              JPG, PNG, WebP · max 5MB
            </span>
          </div>
        )}

        {currentImage && (
          <div className="absolute inset-0">
            <img
              src={currentImage}
              alt="Upload preview"
              className="w-full h-full object-cover"
            />
            {!uploading && (
              <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] opacity-0 hover:opacity-100 flex items-center justify-center gap-[12px] transition-opacity duration-200">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    open(); // Trigger file picker manually
                  }}
                  className="font-mono text-[11px] text-textPrimary border border-border px-[14px] py-[6px] rounded-[4px] bg-bgSurface hover:border-borderHover cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    onChange('');
                  }}
                  className="font-mono text-[11px] text-red border border-[rgba(248,113,113,0.3)] px-[14px] py-[6px] rounded-[4px] bg-bgSurface hover:border-[rgba(248,113,113,0.5)] cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-[rgba(10,12,11,0.8)] flex flex-col items-center justify-center z-10">
            <style>{`
              @keyframes spin-border {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .spinner-ring {
                animation: spin-border 0.8s linear infinite;
              }
            `}</style>
            <div className="w-[20px] h-[20px] rounded-full border-2 border-[rgba(255,255,255,0.1)] border-t-green spinner-ring" />
            <span className="font-mono text-[11px] text-textMuted mt-[8px]">
              Uploading...
            </span>
            <span className="font-mono text-[10px] text-textMuted">
              Please wait
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="font-mono text-[10px] text-red mt-[6px]">
          // error: {error}
        </div>
      )}
    </div>
  );
};
