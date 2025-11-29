import { FC, useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, GripVertical } from 'lucide-react';

interface UploadedImage {
  ipfsHash: string;
  ipfsUri: string;
  gatewayUrl: string;
  file?: File;
  isUploading?: boolean;
  error?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  adminWallet: string;
  apiBaseUrl?: string;
}

export const ImageUploader: FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  adminWallet,
  apiBaseUrl = 'http://localhost:3003',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File): Promise<UploadedImage> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${apiBaseUrl}/api/v1/ipfs/upload/image`, {
      method: 'POST',
      headers: {
        'x-wallet-address': adminWallet,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload image');
    }

    const result = await response.json();
    return {
      ipfsHash: result.ipfsHash,
      ipfsUri: result.ipfsUri,
      gatewayUrl: result.gatewayUrl,
    };
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const newImages: UploadedImage[] = [...images];
      const filesToProcess = Array.from(files).slice(0, maxImages - images.length);

      for (const file of filesToProcess) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // Add placeholder with loading state
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const placeholderImage: UploadedImage = {
          ipfsHash: tempId,
          ipfsUri: '',
          gatewayUrl: URL.createObjectURL(file),
          file,
          isUploading: true,
        };
        newImages.push(placeholderImage);
        onImagesChange([...newImages]);

        try {
          const uploadedImage = await uploadImage(file);
          const index = newImages.findIndex((img) => img.ipfsHash === tempId);
          if (index !== -1) {
            newImages[index] = uploadedImage;
            onImagesChange([...newImages]);
          }
        } catch (error: any) {
          const index = newImages.findIndex((img) => img.ipfsHash === tempId);
          if (index !== -1) {
            newImages[index] = {
              ...newImages[index],
              isUploading: false,
              error: error.message,
            };
            onImagesChange([...newImages]);
          }
        }
      }
    },
    [images, maxImages, onImagesChange, adminWallet, apiBaseUrl]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset input
      e.target.value = '';
    },
    [handleFiles]
  );

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const retryUpload = async (index: number) => {
    const image = images[index];
    if (!image.file) return;

    const newImages = [...images];
    newImages[index] = { ...image, isUploading: true, error: undefined };
    onImagesChange(newImages);

    try {
      const uploadedImage = await uploadImage(image.file);
      newImages[index] = uploadedImage;
      onImagesChange([...newImages]);
    } catch (error: any) {
      newImages[index] = { ...image, isUploading: false, error: error.message };
      onImagesChange([...newImages]);
    }
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOverItem = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);
    onImagesChange(newImages);
    setDraggedIndex(targetIndex);
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${
            isDragging
              ? 'border-solana-purple-500 bg-solana-purple-500/10'
              : 'border-solana-dark-700 hover:border-solana-dark-600 hover:bg-solana-dark-800/50'
          }
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={images.length >= maxImages}
        />

        <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-solana-purple-400' : 'text-solana-dark-400'}`} />
        <p className="text-sm text-solana-dark-300 mb-1">
          {isDragging ? (
            'Drop images here'
          ) : (
            <>
              <span className="text-solana-purple-400 font-medium">Click to upload</span> or drag and drop
            </>
          )}
        </p>
        <p className="text-xs text-solana-dark-500">
          PNG, JPG, GIF or WEBP (max {maxImages} images)
        </p>
        {images.length > 0 && (
          <p className="text-xs text-solana-dark-400 mt-2">
            {images.length} / {maxImages} images uploaded
          </p>
        )}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={`${image.ipfsHash}-${index}`}
              draggable={!image.isUploading && !image.error}
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOverItem(e, index)}
              className={`
                relative aspect-square rounded-lg overflow-hidden group
                ${draggedIndex === index ? 'opacity-50' : ''}
                ${image.error ? 'ring-2 ring-red-500' : ''}
              `}
            >
              {/* Image */}
              {image.gatewayUrl ? (
                <img
                  src={image.gatewayUrl}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-solana-dark-800 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-solana-dark-600" />
                </div>
              )}

              {/* Loading overlay */}
              {image.isUploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-solana-purple-400 animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {image.error && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2">
                  <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
                  <p className="text-xs text-red-300 text-center mb-2 line-clamp-2">{image.error}</p>
                  <button
                    onClick={() => retryUpload(index)}
                    className="text-xs text-solana-purple-400 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Hover controls */}
              {!image.isUploading && !image.error && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <div className="absolute top-1 left-1 p-1 rounded bg-black/50 cursor-grab">
                    <GripVertical className="w-4 h-4 text-white" />
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}

              {/* First image badge */}
              {index === 0 && !image.isUploading && !image.error && (
                <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-solana-purple-500 text-[10px] font-medium text-white">
                  Main
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      {images.length > 0 && (
        <p className="text-xs text-solana-dark-500 text-center">
          Drag images to reorder. The first image will be used as the main property image.
        </p>
      )}
    </div>
  );
};
