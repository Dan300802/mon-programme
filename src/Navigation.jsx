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
  burger: <path d="M4 7h16M4 12h16M4 17h16" />,
  fermer: <path d="M6 6l12 12M18 6L6 18" />,
}

function Icone({ nom }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[nom]}
    </svg>
  )
}

function Logo() {
  return (
    <div className="tb-logo">
      <span className="tb-logo-icone"><Icone nom="pouls" /></span>
      Mon Programme
    </div>
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
  const [ouvert, setOuvert] = useState(false) // menu du compte (tablette, ordinateur)
  const [menu, setMenu] = useState(false) // menu burger (téléphone)
  const zone = useRef(null)
  const declencheur = useRef(null)
  const burger = useRef(null)
  const fermer = useRef(null)

  // Menu du compte : fermeture au clic extérieur et avec Échap
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

  // Menu burger : page bloquée derrière, focus sur la croix, fermeture avec Échap
  useEffect(() => {
    if (!menu) return
    document.body.style.overflow = 'hidden'
    fermer.current?.focus()
    function touche(e) {
      if (e.key === 'Escape') {
        setMenu(false)
        burger.current?.focus()
      }
    }
    document.addEventListener('keydown', touche)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', touche)
    }
  }, [menu])

  // Si l'écran s'agrandit (rotation, redimensionnement), on ferme le burger
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 641px)')
    const surChangement = () => {
      if (mq.matches) setMenu(false)
    }
    mq.addEventListener('change', surChangement)
    return () => mq.removeEventListener('change', surChangement)
  }, [])

  function choisir(id) {
    onChange(id)
    setMenu(false)
  }

  return (
    <>
      <header className="tb">
        <div className="tb-interieur">
          <Logo />

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

          <button
            ref={burger}
            className="bg"
            onClick={() => setMenu(true)}
            aria-expanded={menu}
            aria-controls="menu-mobile"
            aria-label="Ouvrir le menu"
          >
            <Icone nom="burger" />
          </button>
        </div>
      </header>

      <div className={menu ? 'dr-voile ouvert' : 'dr-voile'} onClick={() => setMenu(false)} aria-hidden="true" />
      <aside
        id="menu-mobile"
        className={menu ? 'dr ouvert' : 'dr'}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
      >
        <div className="dr-tete">
          <Logo />
          <button ref={fermer} className="dr-fermer" onClick={() => setMenu(false)} aria-label="Fermer le menu">
            <Icone nom="fermer" />
          </button>
        </div>

        <div className="dr-compte">
          <span className="tb-avatar">{initiales(nom, email)}</span>
          <div>
            <strong>{nom || 'Mon compte'}</strong>
            <span>{email}</span>
          </div>
        </div>

        <nav className="dr-liste" aria-label="Navigation principale">
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              className="dr-item"
              aria-current={vue === o.id ? 'page' : undefined}
              onClick={() => choisir(o.id)}
            >
              <Icone nom={o.icone} />
              {o.libelle}
            </button>
          ))}
        </nav>

        <button className="dr-sortie" onClick={onDeconnexion}>
          <Icone nom="sortie" />
          Se déconnecter
        </button>
      </aside>
    </>
  )
}