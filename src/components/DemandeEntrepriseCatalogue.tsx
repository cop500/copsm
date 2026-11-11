'use client'

import { useMemo, useState, type ComponentType } from 'react'
import {
  Briefcase,
  Cpu,
  Factory,
  Fish,
  GraduationCap,
  Hammer,
  HardHat,
  HeartPulse,
  Hotel,
  Palette,
  Sprout,
  type LucideProps,
} from 'lucide-react'

function iconePole(nom: string): ComponentType<LucideProps> {
  const n = (nom || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (n.includes('agricultur')) return Sprout
  if (n.includes('artisanat')) return Hammer
  if (n.includes('graphique') || n.includes('art')) return Palette
  if (n.includes('btp') || n.includes('batiment')) return HardHat
  if (n.includes('digital') || n.includes('ia') || n.includes('info')) return Cpu
  if (n.includes('gestion') || n.includes('commerce')) return Briefcase
  if (n.includes('industrie')) return Factory
  if (n.includes('peche')) return Fish
  if (n.includes('sante')) return HeartPulse
  if (n.includes('tourisme') || n.includes('hotel') || n.includes('restaurant')) return Hotel
  return GraduationCap
}

export type CataloguePole = {
  id: string
  nom: string
  description?: string | null
  couleur?: string | null
  actif?: boolean
}

export type CatalogueFiliere = {
  id: string
  nom: string
  pole_id: string
  description?: string | null
  actif?: boolean
}

type Props = {
  poles: CataloguePole[]
  filieres: CatalogueFiliere[]
  selectedFiliereIds?: string[]
  peutDemander?: boolean
  onChoisir: (poleId: string, filiereId: string) => void
}

export function DemandeEntrepriseCatalogue({
  poles,
  filieres,
  selectedFiliereIds = [],
  peutDemander = false,
  onChoisir,
}: Props) {
  const [recherche, setRecherche] = useState('')
  const [poleOuvert, setPoleOuvert] = useState<string | null>(null)

  const polesActifs = useMemo(
    () => poles.filter((p) => p.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    [poles]
  )

  const filieresActives = useMemo(
    () => filieres.filter((f) => f.actif !== false),
    [filieres]
  )

  const q = recherche.trim().toLowerCase()

  const polesAffiches = useMemo(() => {
    if (!q) return polesActifs
    return polesActifs.filter((pole) => {
      const filieresPole = filieresActives.filter((f) => f.pole_id === pole.id)
      return (
        pole.nom.toLowerCase().includes(q) ||
        (pole.description || '').toLowerCase().includes(q) ||
        filieresPole.some((f) => f.nom.toLowerCase().includes(q))
      )
    })
  }, [polesActifs, filieresActives, q])

  return (
    <aside className="bg-white border border-slate-200 rounded-2xl overflow-hidden lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 bg-[#004080]">
        <p className="text-[11px] uppercase tracking-wide text-blue-100">CMC Souss-Massa</p>
        <h2 className="text-lg font-semibold text-white mt-0.5">Catalogue des formations</h2>
        <p className="text-sm text-blue-100 mt-2 leading-snug">
          {peutDemander
            ? 'Ajoutez un ou plusieurs profils. Vous pouvez les supprimer dans le formulaire.'
            : 'Parcourez les pôles et filières. À l’étape 2, vous pourrez demander un ou plusieurs profils.'}
        </p>
      </div>

      <div className="p-4 border-b border-slate-100">
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un pôle ou une filière…"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004080] focus:border-[#004080]"
        />
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {polesAffiches.length === 0 && (
          <p className="text-sm text-slate-500 px-2 py-6 text-center">Aucun résultat.</p>
        )}
        {polesAffiches.map((pole) => {
          const filieresPole = filieresActives
            .filter((f) => f.pole_id === pole.id)
            .filter((f) => !q || f.nom.toLowerCase().includes(q) || pole.nom.toLowerCase().includes(q))
            .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
          const ouvert = poleOuvert === pole.id || Boolean(q)
          const couleur = pole.couleur || '#004080'
          const Icone = iconePole(pole.nom)
          const descriptionUtile =
            pole.description &&
            pole.description.trim().toLowerCase() !== pole.nom.trim().toLowerCase()
              ? pole.description
              : null

          return (
            <div key={pole.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setPoleOuvert(ouvert && !q ? null : pole.id)}
                className="w-full text-left px-3 py-3 flex items-start gap-3 hover:bg-slate-50"
              >
                <span
                  className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${couleur}22`, color: couleur }}
                >
                  <Icone className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{pole.nom}</span>
                  {descriptionUtile && (
                    <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {descriptionUtile}
                    </span>
                  )}
                  <span className="block text-xs text-slate-400 mt-1">
                    {filieresActives.filter((f) => f.pole_id === pole.id).length} filière(s)
                  </span>
                </span>
              </button>
              {ouvert && (
                <ul className="border-t border-slate-100 bg-slate-50/80 px-2 py-2 space-y-1.5">
                  {filieresPole.length === 0 && (
                    <li className="text-xs text-slate-500 px-2 py-1">Pas de filière listée.</li>
                  )}
                  {filieresPole.map((filiere) => {
                    const dejaDemande = selectedFiliereIds.includes(filiere.id)
                    return (
                      <li key={filiere.id}>
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            dejaDemande ? 'bg-white border border-[#004080]' : 'bg-white border border-transparent'
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-800">{filiere.nom}</p>
                          {filiere.description &&
                            filiere.description.trim().toLowerCase() !== filiere.nom.trim().toLowerCase() && (
                            <p className="text-xs text-slate-500 mt-0.5">{filiere.description}</p>
                          )}
                          {peutDemander ? (
                            <button
                              type="button"
                              onClick={() => onChoisir(pole.id, filiere.id)}
                              className="mt-2 text-xs font-semibold text-[#004080] hover:underline"
                            >
                              {dejaDemande ? 'Ajouter un autre de cette filière' : 'Demander ce profil'}
                            </button>
                          ) : (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Disponible à l’étape 2 — Détails des postes
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
