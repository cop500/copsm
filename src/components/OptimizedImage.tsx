import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = '/placeholder-image.jpg',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Commencer à charger 50px avant que l'image soit visible
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // URL optimisée avec paramètres de redimensionnement Supabase
  const getOptimizedUrl = (url: string) => {
    if (!url || !isInView) return placeholder;
    
    try {
      // Si c'est une URL Supabase Storage, ajouter des paramètres d'optimisation
      if (url.includes('supabase.co')) {
        const baseUrl = url.split('?')[0];
        const params = new URLSearchParams();
        
        if (width) params.append('width', width.toString());
        if (height) params.append('height', height.toString());
        params.append('quality', '80'); // Qualité réduite pour les performances
        params.append('format', 'webp'); // Format moderne plus léger
        
        return `${baseUrl}?${params.toString()}`;
      }
      
      return url;
    } catch {
      return url;
    }
  };

  const imageUrl = getOptimizedUrl(src);
  const displayUrl = hasError ? placeholder : imageUrl;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Image principale */}
      <img
        ref={imgRef}
        src={displayUrl}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
      
      {/* Fallback pour les erreurs */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          <span>Image non disponible</span>
        </div>
      )}
    </div>
  );
};
