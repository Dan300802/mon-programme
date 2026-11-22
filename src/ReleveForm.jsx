import { useState } from 'react'

// Débit (Mbit/s) en dessous duquel un routeur est marqué « faible ».
// À 0, il est marqué « panne ». Modifie cette valeur selon tes besoins.
const SEUIL_FAIBLE = 20

function etatDepuis(debit) {
  if (debit === 0) return 'panne'
  if (debit < SEUIL_FAIBLE) return 'faible'
  return 'normal'
}

const SIGNALEMENTS = [
  ['aucun', 'Aucun'],
  ['panne', 'Panne'],
  ['demande_client', 'Demande client'],
]

export default function ReleveForm({ onEnregistrer, onFermer }) {
  const [station, setStation] = useState('')
  const [nb, setNb] = useState(1)
  const [debits, setDebits] = useState(['', '', ''])
  const [type, setType] = useState('aucun')
  const [details, setDetails] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState(null)

  function changerDebit(i, valeur) {
    setDebits((d) => d.map((x, j) => (j === i ? valeur : x)))
  }

  async function soumettre(e) {
    e.preventDefault()
    const mesures = []
    for (let i = 0; i < nb; i++) {
      const debit = Number(debits[i].replace(',', '.'))
      if (debits[i].trim() === '' || Number.isNaN(debit) || debit < 0) {
        setMessage(`Débit invalide pour le routeur ${i + 1}.`)
        return
      }
      mesures.push({ numero: i + 1, debit_mbps: debit, etat: etatDepuis(debit) })
    }
    setMessage(null)
    setEnvoi(true)
    await onEnregistrer({
      station: station.trim(),
      mesures,
      signalement:
        type === 'aucun' ? null : { type, details: details.trim() || null },
    })
    setEnvoi(false)
  }

  return (
    <div className="voile" onClick={onFermer}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        onSubmit={soumettre}
      >
        <h2>Relevé sur station</h2>

        <label htmlFor="station">Nom de la station</label>
        <input
          id="station"
          type="text"
          value={station}
          onChange={(e) => setStation(e.target.value)}
          placeholder="Saisir le nom de la station"
          required
          autoFocus
        />

        <div className="lbl">Nombre de routeurs</div>
        <div className="seg" role="group" aria-label="Nombre de routeurs">
          {[1, 2, 3].map((n) => (
            <button
              type="button"
              key={n}
              className={n === nb ? 'actif' : ''}
              aria-pressed={n === nb}
              onClick={() => setNb(n)}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="test-debit">
  <span>Mesurer le débit :</span>
  <a href="https://fast.com" target="_blank" rel="noopener noreferrer">Fast.com</a>
  <a href="https://www.speedtest.net" target="_blank" rel="noopener noreferrer">Speedtest</a>
</div>
<p className="aide">
  Connectez le téléphone au Wi-Fi du routeur à tester, lancez le test, puis saisissez
  le débit de téléchargement ci-dessous.
</p>

        {Array.from({ length: nb }, (_, i) => (
          <div key={i}>
            <label htmlFor={`debit${i}`}>Routeur {i + 1} : débit (Mbit/s)</label>
            <input
              id={`debit${i}`}
              type="text"
              inputMode="decimal"
              value={debits[i]}
              onChange={(e) => changerDebit(i, e.target.value)}
              required
            />
          </div>
        ))}

        <div className="lbl">Signalement</div>
        <div className="seg" role="group" aria-label="Signalement">
          {SIGNALEMENTS.map(([valeur, libelle]) => (
            <button
              type="button"
              key={valeur}
              className={type === valeur ? 'actif' : ''}
              aria-pressed={type === valeur}
              onClick={() => setType(valeur)}
            >
              {libelle}
            </button>
          ))}
        </div>

        {type !== 'aucun' && (
          <>
            <label htmlFor="details">Détails</label>
            <textarea
              id="details"
              rows="3"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </>
        )}

        {message && <p className="msg-erreur" role="alert">{message}</p>}

        <div className="actions">
          <button type="button" className="btn-sec" onClick={onFermer}>Annuler</button>
          <button type="submit" className="btn-principal" disabled={envoi}>Enregistrer</button>
        </div>
      </form>
    </div>
  )
}