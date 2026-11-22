import { useEffect, useRef, useState } from 'react'
import ReseauAnime from './ReseauAnime'
import './Public.css'

const ICONES = {
  calendrier: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  pouls: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  alerte: (
    <>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5M12 18v.5" />
    </>
  ),
  fichier: (
    <>
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M14 3v6h6M9 14h6M9 17h6" />
    </>
  ),
}

const FONCTIONS = [
  { icone: 'calendrier', titre: 'Programme du jour', texte: 'Tâches restantes et réalisées, rendez-vous à venir, urgences et retards : tout est visible dès l’ouverture.' },
  { icone: 'pouls', titre: 'Monitoring des stations', texte: 'Relevez le débit de chaque routeur (1 à 3 par station) depuis votre téléphone, avec un état Normal, Faible ou Panne.' },
  { icone: 'alerte', titre: 'Pannes et demandes clients', texte: 'Notifiez une panne ou enregistrez la demande du client de la station, rattachée à son relevé.' },
  { icone: 'fichier', titre: 'Fiche Excel mensuelle', texte: 'Exportez en un clic le détail du mois, prêt à confier à votre IA pour préparer le PowerPoint.' },
]

const ETAPES = [
  { titre: 'Planifiez', texte: 'Ajoutez vos tâches et rendez-vous en quelques secondes.' },
  { titre: 'Mesurez sur place', texte: 'Lancez un test de débit et saisissez le résultat de chaque routeur.' },
  { titre: 'Exportez', texte: 'Téléchargez la fiche du mois et générez votre rapport.' },
]

function Icone({ nom }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[nom]}
    </svg>
  )
}

function Apparition({ children, delai = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('vu')
          io.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="lp-apparait" style={{ transitionDelay: `${delai}ms` }}>
      {children}
    </div>
  )
}

function CarteDebit() {
  const [pts, setPts] = useState(() =>
    Array.from({ length: 24 }, (_, i) => 46 + Math.sin(i / 2) * 4)
  )

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setPts((p) => [...p.slice(1), 40 + Math.random() * 12])
    }, 1200)
    return () => clearInterval(id)
  }, [])

  const coords = pts
    .map((v, i) => `${(i / (pts.length - 1)) * 280},${80 - ((v - 30) / 30) * 70}`)
    .join(' ')
  const dernier = pts[pts.length - 1].toFixed(1).replace('.', ',')

  return (
    <div className="lp-demo">
      <div className="lp-flotte lp-flotte-a">Fiche Excel prête</div>
      <div className="lp-flotte lp-flotte-b">Panne notifiée</div>
      <div className="lp-carte">
        <div className="lp-carte-tete">
          <span className="lp-carte-nom"><i className="lp-point" />Station A · Routeur 1</span>
          <span className="lp-etiquette">Exemple</span>
        </div>
        <div className="lp-valeur">{dernier}<small> Mbit/s</small></div>
        <svg className="lp-spark" viewBox="0 0 280 80" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="lp-degrade-zone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`${coords} 280,80 0,80`} fill="url(#lp-degrade-zone)" />
          <polyline points={coords} fill="none" stroke="#67e8f9" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
        <div className="lp-carte-pied">
          <span className="lp-etat">Normal</span>
          <span>Débit descendant</span>
        </div>
      </div>
    </div>
  )
}

export default function Landing({ onConnexion, onInscription }) {
  function versFonctions() {
    document.getElementById('fonctions')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="lp">
      <header className="lp-nav">
        <div className="lp-logo"><span className="lp-logo-point" />Mon Programme</div>
        <div className="lp-nav-actions">
          <button className="lp-lien lp-masque-mobile" onClick={versFonctions}>Fonctionnalités</button>
          <button className="lp-lien" onClick={onConnexion}>Se connecter</button>
          <button className="lp-btn" onClick={onInscription}>Créer un compte</button>
        </div>
      </header>

      <section className="lp-hero">
        <ReseauAnime />
        <div className="lp-hero-contenu">
          <div className="lp-hero-texte">
            <span className="lp-badge"><i />Pour les techniciens réseau sur le terrain</span>
            <h1>
              Votre programme du jour et le monitoring de vos routeurs,{' '}
              <span className="lp-degrade">au même endroit.</span>
            </h1>
            <p>
              Planifiez vos tâches, mesurez le débit de chaque station, notifiez les pannes,
              puis exportez la fiche du mois en un clic.
            </p>
            <div className="lp-cta">
              <button className="lp-btn lp-btn-grand" onClick={onInscription}>Créer mon compte</button>
              <button className="lp-btn lp-btn-grand lp-btn-sec" onClick={onConnexion}>Se connecter</button>
            </div>
          </div>
          <CarteDebit />
        </div>
      </section>

      <section className="lp-section" id="fonctions">
        <Apparition>
          <h2>Tout ce qu’il faut pour votre journée</h2>
          <p className="lp-sous">Un seul outil, sur ordinateur comme sur téléphone, de la planification au rapport.</p>
        </Apparition>
        <div className="lp-grille">
          {FONCTIONS.map((f, i) => (
            <Apparition key={f.titre} delai={i * 100}>
              <div className="lp-fonction">
                <div className="lp-icone"><Icone nom={f.icone} /></div>
                <h3>{f.titre}</h3>
                <p>{f.texte}</p>
              </div>
            </Apparition>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <Apparition>
          <h2>Comment ça marche</h2>
        </Apparition>
        <div className="lp-grille lp-etapes">
          {ETAPES.map((e, i) => (
            <Apparition key={e.titre} delai={i * 120}>
              <div className="lp-etape">
                <span className="lp-num">{i + 1}</span>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </div>
            </Apparition>
          ))}
        </div>
      </section>

      <Apparition>
        <section className="lp-final">
          <h2>Prêt à organiser votre prochain lundi ?</h2>
          <p className="lp-sous">Créez votre compte et commencez en quelques minutes.</p>
          <button className="lp-btn lp-btn-grand" onClick={onInscription}>Créer mon compte</button>
        </section>
      </Apparition>

      <footer className="lp-pied">© 2026 Mon Programme</footer>
    </div>
  )
}