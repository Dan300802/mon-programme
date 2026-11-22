import { useEffect, useRef, useState } from 'react'
import './Navigation.css'

const ONGLETS = [
  { id: 'accueil', libelle: 'Accueil', icone: 'accueil' },
  { id: 'monitoring', libelle: 'Monitoring', icone: 'pouls' },
]

const ICONES = {
  accueil: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10M10 20v-6h4v6" />
    </>
  ),
  pouls: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  sortie: (
    <>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
}

function Icone({ nom }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[nom]}
    </svg>
  )
}

function initiales(nom, email) {
  const source = (nom || email || '?').trim()
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((m) => m[0])
    .join('')
    .toUpperCase()
}

export default function Navigation({ vue, onChange, nom, email, onDeconnexion }) {
  const [ouvert, setOuvert] = useState(false)
  const zone = useRef(null)
  const declencheur = useRef(null)

  useEffect(() => {
    if (!ouvert) return
    function clicExterieur(e) {
      if (zone.current && !zone.current.contains(e.target)) setOuvert(false)
    }
    function touche(e) {
      if (e.key === 'Escape') {
        setOuvert(false)
        declencheur.current?.focus()
      }
    }
    document.addEventListener('pointerdown', clicExterieur)
    document.addEventListener('keydown', touche)
    return () => {
      document.removeEventListener('pointerdown', clicExterieur)
      document.removeEventListener('keydown', touche)
    }
  }, [ouvert])

  return (
    <>
      <header className="tb">
        <div className="tb-interieur">
          <div className="tb-logo">
            <span className="tb-logo-icone"><Icone nom="pouls" /></span>
            Mon Programme
          </div>

          <nav className="tb-onglets" aria-label="Navigation principale">
            {ONGLETS.map((o) => (
              <button
                key={o.id}
                className="tb-onglet"
                aria-current={vue === o.id ? 'page' : undefined}
                onClick={() => onChange(o.id)}
              >
                <Icone nom={o.icone} />
                {o.libelle}
              </button>
            ))}
          </nav>

          <div className="tb-compte" ref={zone}>
            <button
              ref={declencheur}
              className="tb-compte-btn"
              onClick={() => setOuvert(!ouvert)}
              aria-expanded={ouvert}
              aria-controls="menu-compte"
              aria-label="Menu du compte"
            >
              <span className="tb-avatar">{initiales(nom, email)}</span>
              <span className="tb-nom">{nom || email}</span>
              <span className={ouvert ? 'tb-chevron ouvert' : 'tb-chevron'}><Icone nom="chevron" /></span>
            </button>

            {ouvert && (
              <div className="tb-panneau" id="menu-compte">
                <div className="tb-infos">
                  <strong>{nom || 'Mon compte'}</strong>
                  <span>{email}</span>
                </div>
                <button className="tb-sortie" onClick={onDeconnexion}>
                  <Icone nom="sortie" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="bb" aria-label="Navigation principale">
        <div className="bb-liste">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              className="bb-onglet"
              aria-current={vue === o.id ? 'page' : undefined}
              onClick={() => onChange(o.id)}
            >
              <Icone nom={o.icone} />
              {o.libelle}
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}