'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  style?: React.CSSProperties
  className?: string
}

/**
 * Composant Google AdSense pour afficher des publicités
 * 
 * @param adSlot - L'ID de l'emplacement publicitaire (sera créé dans AdSense après validation)
 * @param adFormat - Format de la publicité (par défaut: 'auto')
 * @param style - Styles CSS personnalisés
 * @param className - Classes CSS personnalisées
 */
export default function AdSense({ 
  adSlot, 
  adFormat = 'auto',
  style,
  className = ''
}: AdSenseProps) {
  const adInitialized = useRef(false);

  useEffect(() => {
    // Initialiser AdSense après le chargement du script
    const initializeAd = () => {
      if (adInitialized.current) return;
      
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle && !adInitialized.current) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          adInitialized.current = true;
        }
      } catch (err) {
        console.error('Erreur initialisation AdSense:', err);
      }
    };

    // Vérifier si le script est déjà chargé
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      initializeAd();
    }

    // Réessayer après un court délai
    const timer = setTimeout(initializeAd, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Script
        id={`adsense-script-${adSlot}`}
        strategy="afterInteractive"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9077690792762785"
        crossOrigin="anonymous"
        onLoad={() => {
          try {
            if (typeof window !== 'undefined' && (window as any).adsbygoogle && !adInitialized.current) {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              adInitialized.current = true;
            }
          } catch (err) {
            console.error('Erreur initialisation AdSense après chargement:', err);
          }
        }}
        onError={(e) => {
          console.error('Erreur chargement AdSense script:', e);
        }}
      />
      <div 
        className={`adsense-container ${className}`}
        style={{ 
          display: 'block',
          textAlign: 'center',
          minHeight: '100px',
          ...style 
        }}
      >
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
          }}
          data-ad-client="ca-pub-9077690792762785"
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
      </div>
    </>
  );
}

