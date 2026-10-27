'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { CopSpacePublicMark } from '@/components/CopSpacePublicMark'
import { PORTES_STAGIAIRE, type PorteStagiaire } from '@/lib/portesStagiaire'
import './portes.css'

function buildUrl(path: string, origin: string) {
  return `${origin.replace(/\/$/, '')}${path}`
}

function PorteCard({
  porte,
  origin,
}: {
  porte: PorteStagiaire
  origin: string
}) {
  const url = buildUrl(porte.path, origin)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(url, {
      margin: 1,
      width: 360,
      color: { dark: '#0F3D6C', light: '#FFFFFF' },
    }).then((data) => {
      if (alive) setQr(data)
    })
    return () => {
      alive = false
    }
  }, [url])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const shortUrl = url.replace(/^https?:\/\//, '')

  return (
    <article className="portes-card">
      <div className="portes-qr">
        {qr ? (
          <img src={qr} alt={`QR ${porte.titre}`} />
        ) : (
          <div className="h-full w-full animate-pulse rounded-lg bg-slate-100" />
        )}
      </div>
      <span className="portes-verbe">{porte.verbe}</span>
      <h3>{porte.titre}</h3>
      <p>{porte.resume}</p>
      <span className="portes-url">{shortUrl}</span>
      <div className="portes-actions">
        <a href={url}>Ouvrir</a>
        <button type="button" onClick={copy}>
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
    </article>
  )
}

export default function PortesStagiairePage() {
  const [origin, setOrigin] = useState('https://copsm.space')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const essentielles = useMemo(
    () => PORTES_STAGIAIRE.filter((p) => p.essentielle),
    []
  )
  const plus = useMemo(
    () => PORTES_STAGIAIRE.filter((p) => !p.essentielle),
    []
  )

  return (
    <div className="portes-root">
      <div className="portes-aurora" />
      <div className="portes-ring portes-ring-a" />
      <div className="portes-ring portes-ring-b" />
      <div className="portes-vignette" />

      <div className="portes-inner">
        <header className="portes-hero">
          <div className="mb-4 flex justify-center">
            <CopSpacePublicMark variant="onDark" size="md" />
          </div>
          <span className="portes-kicker">ESPACE STAGIAIRE</span>
          <h1 className="portes-title">Toutes tes portes, un scan.</h1>
          <p className="portes-lead">
            Pas de compte. Pas de menu caché. Scanne le QR ou ouvre le lien :
            ateliers, CV, candidatures, aide — uniquement ce qui te concerne.
          </p>
        </header>

        <section className="portes-section">
          <h2>Les 4 essentielles</h2>
          <div className="portes-cards essentielles">
            {essentielles.map((porte) => (
              <PorteCard key={porte.id} porte={porte} origin={origin} />
            ))}
          </div>
        </section>

        <section className="portes-section">
          <h2>Pour aller plus loin</h2>
          <div className="portes-cards plus">
            {plus.map((porte) => (
              <PorteCard key={porte.id} porte={porte} origin={origin} />
            ))}
          </div>
        </section>

        <p className="portes-foot">
          COP Space · Centre d’Orientation Professionnelle · CMC Souss-Massa
        </p>
      </div>
    </div>
  )
}
