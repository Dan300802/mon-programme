import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import ReleveForm from './ReleveForm'
import { exporterReleves } from './exportExcel'

const LIBELLES_ETAT = { normal: 'Normal', faible: 'Faible', panne: 'Panne' }

function Stat({ libelle, court, valeur, couleur }) {
  return (
    <div className="carte">
      <span className="long">{libelle}</span>
      <span className="court">{court}</span>
      <strong className={couleur}>{valeur}</strong>
    </div>
  )
}

export default function Monitoring() {
  const today = new Date().toLocaleDateString('en-CA')
  const dateTexte = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const [releves, setReleves] = useState([])
  const [erreur, setErreur] = useState(null)
  const [ouvert, setOuvert] = useState(false)

  async function charger() {
    const { data, error } = await supabase
      .from('releves')
      .select('*, mesures_routeur(*), signalements(*)')
      .eq('date_releve', today)
      .order('created_at')
    if (error) setErreur(error.message)
    else setReleves(data)
  }

  useEffect(() => {
    charger()
  }, [])

  async function enregistrer({ station, mesures, signalement }) {
    const { data: releve, error } = await supabase
      .from('releves')
      .insert({ station, date_releve: today })
      .select()
      .single()
    if (error) return setErreur(error.message)

    const { error: e2 } = await supabase
      .from('mesures_routeur')
      .insert(mesures.map((m) => ({ ...m, releve_id: releve.id })))
    if (e2) return setErreur(e2.message)

    if (signalement) {
      const { error: e3 } = await supabase
        .from('signalements')
        .insert({ ...signalement, releve_id: releve.id })
      if (e3) return setErreur(e3.message)
    }

    setOuvert(false)
    charger()
  }

  async function exporter() {
  try {
    await exporterReleves(releves, today)
  } catch (e) {
    setErreur(e.message)
  }
}

  const mesures = releves.flatMap((r) => r.mesures_routeur)
  const signalements = releves.flatMap((r) => r.signalements)
  const pannes = signalements.filter((s) => s.type === 'panne').length
  const demandes = signalements.filter((s) => s.type === 'demande_client').length

  const lignes = releves.flatMap((r) =>
    [...r.mesures_routeur]
      .sort((a, b) => a.numero - b.numero)
      .map((m, i) => ({ r, m, premiere: i === 0 }))
  )

  function texteSignalement(r) {
    if (r.signalements.length === 0) return 'Aucun'
    return r.signalements
      .map((s) =>
        (s.type === 'panne' ? 'Panne notifiée' : 'Demande client') +
        (s.details ? ' : ' + s.details : '')
      )
      .join(' ; ')
  }

  if (erreur) return <p>Erreur : {erreur}</p>

  return (
    <>
      <div className="entete">
  <div>
    <div className="date">{dateTexte}</div>
    <h1>Monitoring des stations</h1>
  </div>
  <div className="groupe-btn">
    <button
      className="btn-sec"
      onClick={exporter}
      disabled={releves.length === 0}
    >
      <span className="long">Exporter vers Excel</span>
      <span className="court">Excel</span>
    </button>
    <button className="btn-principal btn-ajout" onClick={() => setOuvert(true)}>
      <span className="long">+ Nouveau relevé</span>
      <span className="court">+ Relevé</span>
    </button>
  </div>
</div>

      <section className="stats">
        <Stat libelle="Stations visitées" court="Stations" valeur={releves.length} />
        <Stat libelle="Routeurs mesurés" court="Routeurs" valeur={mesures.length} />
        <Stat libelle="Pannes notifiées" court="Pannes" valeur={pannes} couleur="rouge" />
        <Stat libelle="Demandes clients" court="Demandes" valeur={demandes} couleur="indigo" />
      </section>

      <section className="bloc tableau-bloc">
        <h2>Relevés du jour</h2>
        {lignes.length === 0 ? (
          <p className="vide">Aucun relevé enregistré aujourd’hui.</p>
        ) : (
          <div className="defile">
            <table>
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Station</th>
                  <th>Routeur</th>
                  <th>Débit (Mbit/s)</th>
                  <th>État</th>
                  <th>Signalement</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map(({ r, m, premiere }) => (
                  <tr key={m.id}>
                    <td>
                      {new Date(r.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>{r.station}</td>
                    <td>Routeur {m.numero}</td>
                    <td>{String(m.debit_mbps).replace('.', ',')}</td>
                    <td>
                      <span className={'badge ' + m.etat}>{LIBELLES_ETAT[m.etat]}</span>
                    </td>
                    <td>{premiere ? texteSignalement(r) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {ouvert && (
        <ReleveForm onEnregistrer={enregistrer} onFermer={() => setOuvert(false)} />
      )}
    </>
  )
}