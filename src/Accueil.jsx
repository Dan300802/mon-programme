import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { telechargerFicheMois } from './ficheMois'
import FormulaireAjout from './FormulaireAjout'
import ReseauAnime from './ReseauAnime'
import './Accueil.css'

const ICONES = {
  calendrier: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.5" />
    </>
  ),
  horloge: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alerte: (
    <>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5M12 18v.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  telecharger: (
    <>
      <path d="M12 4v11M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  fleche: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
}

function Icone({ nom }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONES[nom]}
    </svg>
  )
}

const reduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Fait défiler un nombre de sa valeur précédente jusqu'à la nouvelle
function useCompteur(cible) {
  const [valeur, setValeur] = useState(0)
  const precedent = useRef(0)

  useEffect(() => {
    const depart = precedent.current
    if (depart === cible || reduit()) {
      precedent.current = cible
      setValeur(cible)
      return
    }
    const debut = performance.now()
    let raf = 0
    const pas = (t) => {
      const p = Math.min((t - debut) / 700, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setValeur(Math.round(depart + (cible - depart) * e))
      if (p < 1) raf = requestAnimationFrame(pas)
      else precedent.current = cible
    }
    raf = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(raf)
  }, [cible])

  return valeur
}

function salutation() {
  const h = new Date().getHours()
  if (h < 5) return 'Bonsoir'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function phrase(total, restantes, urgentes) {
  if (total === 0) return 'Aucun programme aujourd’hui. Profitez-en pour planifier la suite.'
  if (restantes === 0) return 'Tout est terminé pour aujourd’hui. Bravo, belle journée !'
  const base = `Il vous reste ${restantes} programme${restantes > 1 ? 's' : ''} à réaliser aujourd’hui.`
  return urgentes > 0
    ? `${base} ${urgentes} élément${urgentes > 1 ? 's' : ''} urgent${urgentes > 1 ? 's' : ''} ou en retard à traiter.`
    : base
}

function prochainLundi() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const jours = (8 - d.getDay()) % 7
  d.setDate(d.getDate() + jours)
  return {
    jours,
    texte: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

function Anneau({ fait, total }) {
  const [pret, setPret] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setPret(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const pct = total ? fait / total : 0
  const pourcent = useCompteur(Math.round(pct * 100))
  const R = 52
  const C = 2 * Math.PI * R

  return (
    <div
      className="ac-anneau"
      role="img"
      aria-label={`${fait} programme${fait > 1 ? 's' : ''} réalisé${fait > 1 ? 's' : ''} sur ${total} aujourd’hui`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <linearGradient id="ac-degrade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset="1" stopColor="#818cf8" />
          </linearGradient>
        </defs>
        <circle className="ac-anneau-fond" cx="60" cy="60" r={R} />
        <circle
          className="ac-anneau-val"
          cx="60"
          cy="60"
          r={R}
          stroke="url(#ac-degrade)"
          strokeDasharray={C}
          strokeDashoffset={pret ? C * (1 - pct) : C}
          transform="rotate(-90 60 60)"
          style={{ opacity: pct === 0 ? 0 : 1 }}
        />
      </svg>
      <div className="ac-anneau-txt">
        <strong>{pourcent}<small>%</small></strong>
        <span>{fait}/{total} faits</span>
      </div>
    </div>
  )
}

function Stat({ icone, libelle, valeur, teinte, delai }) {
  const v = useCompteur(valeur)
  return (
    <div className={`ac-stat ${teinte}`} style={{ animationDelay: `${delai}ms` }}>
      <span className="ac-stat-icone"><Icone nom={icone} /></span>
      <strong>{v}</strong>
      <span className="ac-stat-lib">{libelle}</span>
    </div>
  )
}

function Ligne({ p, today, onToggle, index }) {
  const fait = p.statut === 'fait'
  const enRetard = !fait && p.date_prevue < today
  const datePrevue = new Date(p.date_prevue + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <li className="ac-ligne" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <input type="checkbox" checked={fait} onChange={() => onToggle(p)} aria-label={p.titre} />
      <div className="ac-texte">
        <span className={fait ? 'ac-titre fait' : 'ac-titre'}>{p.titre}</span>
        <small>
          {enRetard ? `Prévu le ${datePrevue}` : p.heure ? p.heure.slice(0, 5) : 'Sans heure'}
        </small>
        {p.description && <small className="ac-desc">{p.description}</small>}
      </div>
      {enRetard ? (
        <span className="ac-badge ac-badge-retard">En retard</span>
      ) : p.urgent && !fait ? (
        <span className="ac-badge ac-badge-urgent">Urgent</span>
      ) : null}
    </li>
  )
}

function Rendez({ p, today }) {
  const jour =
    p.date_prevue === today
      ? 'AUJ.'
      : new Date(p.date_prevue + 'T00:00:00')
          .toLocaleDateString('fr-FR', { weekday: 'short' })
          .toUpperCase()

  return (
    <li className="ac-rdv-ligne">
      <div className="ac-rdv-date">
        <span>{jour}</span>
        <strong>{p.heure ? p.heure.slice(0, 5) : '--:--'}</strong>
      </div>
      <span className="ac-rdv-titre">{p.titre}</span>
    </li>
  )
}

function Bloc({ icone, titre, compte, alerte, teinte = '', className = '', children }) {
  return (
    <section className={`ac-bloc${alerte ? ' ac-bloc-alerte' : ''} ${className}`}>
      <div className="ac-bloc-tete">
        <span className={`ac-bloc-icone ${teinte}`}><Icone nom={icone} /></span>
        <h2>{titre}</h2>
        {compte !== undefined && <span className="ac-compte">{compte}</span>}
      </div>
      {children}
    </section>
  )
}

function Vide({ texte }) {
  return (
    <p className="ac-vide">
      <Icone nom="check" />
      {texte}
    </p>
  )
}

export default function Accueil({ prenom, onMonitoring }) {
  const [programmes, setProgrammes] = useState([])
  const [erreur, setErreur] = useState(null)
  const [formOuvert, setFormOuvert] = useState(false)
  const [prepFiche, setPrepFiche] = useState(false)
  const [messageFiche, setMessageFiche] = useState(null)
  const [faitesOuvert, setFaitesOuvert] = useState(
    () => !window.matchMedia('(max-width: 640px)').matches
  )

  const today = new Date().toLocaleDateString('en-CA')
  const dateTexte = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  useEffect(() => {
    supabase
      .from('programmes')
      .select('*')
      .order('date_prevue')
      .order('heure')
      .then(({ data, error }) => {
        if (error) setErreur(error.message)
        else setProgrammes(data)
      })
  }, [])

  async function basculer(p) {
    const devientFait = p.statut === 'a_faire'
    const changements = {
      statut: devientFait ? 'fait' : 'a_faire',
      date_realisation: devientFait ? new Date().toISOString() : null,
    }
    const { error } = await supabase.from('programmes').update(changements).eq('id', p.id)

    if (error) setErreur(error.message)
    else
      setProgrammes((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, ...changements } : x))
      )
  }

  async function ajouter(nouveau) {
    const { data, error } = await supabase
      .from('programmes')
      .insert(nouveau)
      .select()
      .single()

    if (error) {
      setErreur(error.message)
      return
    }
    setProgrammes((prev) =>
      [...prev, data].sort((a, b) =>
        (a.date_prevue + (a.heure ?? '99')).localeCompare(b.date_prevue + (b.heure ?? '99'))
      )
    )
    setFormOuvert(false)
  }

  async function telechargerFiche() {
    setPrepFiche(true)
    setMessageFiche(null)
    try {
      await telechargerFicheMois(today.slice(0, 7))
    } catch (e) {
      setMessageFiche(e.message)
    } finally {
      setPrepFiche(false)
    }
  }

  const duJour = programmes.filter((p) => p.date_prevue === today)
  const faites = duJour.filter((p) => p.statut === 'fait')
  const restantes = duJour.filter((p) => p.statut === 'a_faire')
  const urgentes = programmes.filter(
    (p) => p.statut === 'a_faire' && (p.urgent || p.date_prevue < today)
  )
  const rendezVous = programmes
    .filter((p) => p.type === 'rendez-vous' && p.statut === 'a_faire' && p.date_prevue >= today)
    .slice(0, 3)
  const lundi = prochainLundi()
  const quand =
    lundi.jours === 0 ? 'C’est aujourd’hui' : lundi.jours === 1 ? 'Demain' : `Dans ${lundi.jours} jours`

  if (erreur) return <p className="ac-erreur-page" role="alert">Erreur : {erreur}</p>

  return (
    <>
      <section className="ac-hero">
        <ReseauAnime />
        <div className="ac-hero-haut">
          <div className="ac-hero-texte">
            <span className="ac-date">{dateTexte}</span>
            <h1>{salutation()}{prenom ? `, ${prenom}` : ''}</h1>
            <p>{phrase(duJour.length, restantes.length, urgentes.length)}</p>
          </div>
          <Anneau fait={faites.length} total={duJour.length} />
        </div>
        <div className="ac-hero-actions">
          <button className="ac-btn ac-btn-plein ac-cache-mobile" onClick={() => setFormOuvert(true)}>
            <Icone nom="plus" />
            Ajouter un programme
          </button>
          <button className="ac-btn ac-btn-verre" onClick={telechargerFiche} disabled={prepFiche}>
            <Icone nom="telecharger" />
            {prepFiche ? 'Préparation…' : 'Fiche Excel du mois'}
          </button>
        </div>
        {messageFiche && <p className="ac-erreur" role="alert">{messageFiche}</p>}
      </section>

      <section className="ac-stats" aria-label="Chiffres du jour">
        <Stat icone="calendrier" libelle="Prévus aujourd’hui" valeur={duJour.length} teinte="ac-indigo" delai={80} />
        <Stat icone="check" libelle="Réalisées" valeur={faites.length} teinte="ac-vert" delai={140} />
        <Stat icone="horloge" libelle="Restantes" valeur={restantes.length} teinte="ac-cyan" delai={200} />
        <Stat icone="alerte" libelle="Urgentes ou en retard" valeur={urgentes.length} teinte="ac-rouge" delai={260} />
      </section>

      <div className="ac-grille">
        <div className="ac-col">
          <Bloc icone="horloge" titre="Tâches restantes" compte={restantes.length} teinte="ac-cyan" className="ac-restantes">
            {restantes.length === 0 ? (
              <Vide texte="Tout est fait pour aujourd’hui." />
            ) : (
              <ul>
                {restantes.map((p, i) => (
                  <Ligne key={p.id} p={p} today={today} onToggle={basculer} index={i} />
                ))}
              </ul>
            )}
          </Bloc>

          <section className="ac-bloc ac-faites">
            <button
              className="ac-repli"
              onClick={() => setFaitesOuvert(!faitesOuvert)}
              aria-expanded={faitesOuvert}
            >
              <span className="ac-bloc-icone ac-vert"><Icone nom="check" /></span>
              <span className="ac-titre-bloc">Tâches réalisées</span>
              <span className="ac-compte">{faites.length}</span>
              <span className={faitesOuvert ? 'ac-chev ouvert' : 'ac-chev'}><Icone nom="chevron" /></span>
            </button>
            {faitesOuvert &&
              (faites.length === 0 ? (
                <Vide texte="Rien de terminé pour le moment." />
              ) : (
                <ul>
                  {faites.map((p, i) => (
                    <Ligne key={p.id} p={p} today={today} onToggle={basculer} index={i} />
                  ))}
                </ul>
              ))}
          </section>
        </div>

        <div className="ac-col">
          <Bloc alerte icone="alerte" titre="Urgent et en retard" compte={urgentes.length} className="ac-urgent">
            {urgentes.length === 0 ? (
              <Vide texte="Rien d’urgent, bravo." />
            ) : (
              <ul>
                {urgentes.map((p, i) => (
                  <Ligne key={p.id} p={p} today={today} onToggle={basculer} index={i} />
                ))}
              </ul>
            )}
          </Bloc>

          <Bloc icone="calendrier" titre="Prochains rendez-vous" className="ac-rdv">
            {rendezVous.length === 0 ? (
              <Vide texte="Aucun rendez-vous à venir." />
            ) : (
              <ul>
                {rendezVous.map((p) => (
                  <Rendez key={p.id} p={p} today={today} />
                ))}
              </ul>
            )}
          </Bloc>

          <section className="ac-mon">
            <span className="ac-mon-label">Prochain monitoring</span>
            <strong className="ac-mon-date">{lundi.texte}</strong>
            <span className="ac-mon-pill">{quand}</span>
            <svg className="ac-onde" viewBox="0 0 240 60" preserveAspectRatio="none" aria-hidden="true">
              <polyline className="base" points="0,30 50,30 62,12 76,48 88,30 150,30 162,18 174,42 186,30 240,30" />
              <polyline points="0,30 50,30 62,12 76,48 88,30 150,30 162,18 174,42 186,30 240,30" />
            </svg>
            <button className="ac-btn ac-btn-verre" onClick={onMonitoring}>
              Ouvrir le monitoring
              <Icone nom="fleche" />
            </button>
          </section>
        </div>
      </div>

      <button className="ac-fab" onClick={() => setFormOuvert(true)} aria-label="Ajouter un programme">
        <Icone nom="plus" />
      </button>

      {formOuvert && (
        <FormulaireAjout
          today={today}
          onAjouter={ajouter}
          onFermer={() => setFormOuvert(false)}
        />
      )}
    </>
  )
}