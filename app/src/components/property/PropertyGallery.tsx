import { FC, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Expand, Image as ImageIcon } from 'lucide-react';

interface PropertyGalleryProps {
  images: string[];
  propertyName: string;
}

export const PropertyGallery: FC<PropertyGalleryProps> = ({ images, propertyName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    },
    [isLightboxOpen, goToPrevious, goToNext]
  );

  // Add keyboard event listener
  useState(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video rounded-2xl bg-solana-dark-800/50 flex items-center justify-center">
        <div className="text-center text-solana-dark-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No images available</p>
        </div>
      </div>
    );
  }

  const hasError = imageErrors.has(currentIndex);

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-3">
        {/* Main Image */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-solana-dark-800/50 group">
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-solana-dark-800">
              <div className="text-center text-solana-dark-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Image unavailable</p>
              </div>
            </div>
          ) : (
            <img
              src={images[currentIndex]}
              alt={`${propertyName} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => handleImageError(currentIndex)}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Expand button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
          >
            <Expand className="w-5 h-5" />
          </button>

          {/* Image counter */}
          <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                  index === currentIndex
                    ? 'ring-2 ring-solana-purple-500 ring-offset-2 ring-offset-solana-dark-900'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {imageErrors.has(index) ? (
                  <div className="w-full h-full bg-solana-dark-800 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-solana-dark-500" />
                  </div>
                ) : (
                  <img
                    src={image}
                    alt={`${propertyName} - Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Main image */}
          <div
            className="max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {hasError ? (
              <div className="w-96 h-64 bg-solana-dark-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-solana-dark-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Image unavailable</p>
                </div>
              </div>
            ) : (
              <img
                src={images[currentIndex]}
                alt={`${propertyName} - Image ${currentIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onError={() => handleImageError(currentIndex)}
              />
            )}
          </div>

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
            {currentIndex + 1} / {images.length}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto p-2 rounded-lg bg-black/50">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`flex-shrink-0 w-16 h-10 rounded overflow-hidden transition-all ${
                    index === currentIndex
                      ? 'ring-2 ring-white'
                      : 'opacity-50 hover:opacity-100'
                  }`}
                >
                  {imageErrors.has(index) ? (
                    <div className="w-full h-full bg-solana-dark-700 flex items-center justify-center">
                      <ImageIcon className="w-3 h-3 text-solana-dark-500" />
                    </div>
                  ) : (
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(index)}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
