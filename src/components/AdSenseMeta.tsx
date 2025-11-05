'use client'

import { useEffect } from 'react'

/**
 * Composant pour injecter la balise Meta AdSense dans le head du document
 * S'exécute immédiatement au montage pour garantir la présence de la balise
 */
export default function AdSenseMeta() {
  useEffect(() => {
    // Injection immédiate de la balise Meta
    const injectMetaTag = () => {
      const existingMeta = document.querySelector('meta[name="google-adsense-account"]');
      
      if (!existingMeta) {
        const metaTag = document.createElement('meta');
        metaTag.setAttribute('name', 'google-adsense-account');
        metaTag.setAttribute('content', 'ca-pub-9077690792762785');
        // Insérer au début du head pour une meilleure visibilité
        document.head.insertBefore(metaTag, document.head.firstChild);
      } else {
        // S'assurer que le contenu est correct
        if (existingMeta.getAttribute('content') !== 'ca-pub-9077690792762785') {
          existingMeta.setAttribute('content', 'ca-pub-9077690792762785');
        }
      }
    };

    // Exécuter immédiatement
    injectMetaTag();
    
    // Réessayer après un court délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(injectMetaTag, 0);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
}

