'use client'

import Image from 'next/image'

interface BackgroundImageProps {
  src: string
  alt: string
  className?: string
}

export const BackgroundImage: React.FC<BackgroundImageProps> = ({ 
  src, 
  alt, 
  className = '' 
}) => {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority
        quality={90}
      />
    </div>
  )
}

