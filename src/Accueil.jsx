import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import FormulaireAjout from './FormulaireAjout'
import { telechargerFicheMois } from './ficheMois'

function Stat({ libelle, court, valeur, couleur }) {
  return (
    <div className="carte">
      <span className="long">{libelle}</span>
      <span className="court">{court}</span>
      <strong className={couleur}>{valeur}</strong>
    </div>
  )
}

function Ligne({ p, today, onToggle }) {
  const fait = p.statut === 'fait'
  const enRetard = !fait && p.date_prevue < today
  const datePrevue = new Date(p.date_prevue + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <li className="ligne">
      <input
        type="checkbox"
        checked={fait}
        onChange={() => onToggle(p)}
        aria-label={p.titre}
      />
      <div className="texte">
        <span className={fait ? 'titre barre' : 'titre'}>{p.titre}</span>
        <small>
          {enRetard ? `Prévu le ${datePrevue}` : p.heure ? p.heure.slice(0, 5) : 'Sans heure'}
        </small>
      </div>
      {enRetard ? (
        <span className="badge retard">En retard</span>
      ) : p.urgent && !fait ? (
        <span className="badge urgent">Urgent</span>
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
    <li className="rdv-ligne">
      <div className="rdv-date">
        <span>{jour}</span>
        <strong>{p.heure ? p.heure.slice(0, 5) : '--:--'}</strong>
      </div>
      <span className="rdv-titre">{p.titre}</span>
    </li>
  )
}

function Liste({ titre, items, today, onToggle, alerte, vide }) {
  return (
    <section className={alerte ? 'bloc alerte' : 'bloc'}>
      <h2>{titre}</h2>
      {items.length === 0 ? (
        <p className="vide">{vide}</p>
      ) : (
        <ul>
          {items.map((p) => (
            <Ligne key={p.id} p={p} today={today} onToggle={onToggle} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Accueil({ prenom }) {
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
    const { error } = await supabase
      .from('programmes')
      .update(changements)
      .eq('id', p.id)

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

  if (erreur) return <p>Erreur : {erreur}</p>

  return (
    <>
      <header className="entete">
  <div className="groupe-btn">
    <button className="btn-sec" onClick={telechargerFiche} disabled={prepFiche}>
      <span className="long">{prepFiche ? 'Préparation…' : 'Exporter la fiche du mois'}</span>
      <span className="court">{prepFiche ? '…' : 'Fiche du mois'}</span>
    </button>
    <button className="btn-principal btn-ajout" onClick={() => setFormOuvert(true)}>
      <span className="long">+ Ajouter un programme</span>
      <span className="court">+ Ajouter</span>
    </button>
  </div>
</header>
{messageFiche && <p className="msg-erreur" role="alert">{messageFiche}</p>}

      <div className="date">{dateTexte}</div>
      <h1>Bonjour{prenom ? `, ${prenom}` : ''}</h1>
      <p className="sous-titre">
        Vous avez {duJour.length} programme{duJour.length > 1 ? 's' : ''} aujourd’hui.
      </p>

      <section className="stats">
        <Stat libelle="Prévus aujourd’hui" court="Prévus" valeur={duJour.length} />
        <Stat libelle="Réalisées" court="Réalisées" valeur={faites.length} couleur="vert" />
        <Stat libelle="Restantes" court="Restantes" valeur={restantes.length} couleur="indigo" />
        <Stat libelle="Urgentes ou en retard" court="Urgentes" valeur={urgentes.length} couleur="rouge" />
      </section>

      <div className="grille">
        <div className="colonne">
          <Liste
            titre="Tâches restantes"
            items={restantes}
            today={today}
            onToggle={basculer}
            vide="Tout est fait pour aujourd’hui."
          />
          <section className="bloc faites">
            <button
              className="repli"
              onClick={() => setFaitesOuvert(!faitesOuvert)}
              aria-expanded={faitesOuvert}
            >
              <span className="titre-bloc">Tâches réalisées ({faites.length})</span>
              <span aria-hidden="true">{faitesOuvert ? '▲' : '▼'}</span>
            </button>
            {faitesOuvert &&
              (faites.length === 0 ? (
                <p className="vide">Rien de terminé pour le moment.</p>
              ) : (
                <ul>
                  {faites.map((p) => (
                    <Ligne key={p.id} p={p} today={today} onToggle={basculer} />
                  ))}
                </ul>
              ))}
          </section>
        </div>

        <div className="colonne">
          <Liste
            titre="Urgent et en retard"
            items={urgentes}
            today={today}
            onToggle={basculer}
            alerte
            vide="Rien d’urgent, bravo."
          />
          <section className="bloc rdv">
            <h2>Prochains rendez-vous</h2>
            {rendezVous.length === 0 ? (
              <p className="vide">Aucun rendez-vous à venir.</p>
            ) : (
              <ul>
                {rendezVous.map((p) => (
                  <Rendez key={p.id} p={p} today={today} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

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