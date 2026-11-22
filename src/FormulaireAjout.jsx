import { useState } from 'react'

export default function FormulaireAjout({ today, onAjouter, onFermer }) {
  const [titre, setTitre] = useState('')
  const [type, setType] = useState('tache')
  const [date, setDate] = useState(today)
  const [heure, setHeure] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [description, setDescription] = useState('')

  async function soumettre(e) {
    e.preventDefault()
    if (!titre.trim()) return
    setEnvoi(true)
    await onAjouter({
      titre: titre.trim(),
      type,
      date_prevue: date,
      heure: heure || null,
      urgent,
      description: description.trim() || null,
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
        <h2>Ajouter un programme</h2>

        <label htmlFor="titre">Titre</label>
        <input id="titre" type="text" value={titre} onChange={(e) => setTitre(e.target.value)} autoFocus required />

        <label htmlFor="type">Type</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="tache">Tâche</option>
          <option value="rendez-vous">Rendez-vous</option>
        </select>

        <div className="duo">
          <div>
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="heure">Heure</label>
            <input id="heure" type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
          </div>
        </div>

        <label className="case">
          <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          Urgent
        </label>
        <label htmlFor="description">Détails (facultatif)</label>
<textarea
  id="description"
  rows="3"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>

        <div className="actions">
          <button type="button" className="btn-sec" onClick={onFermer}>Annuler</button>
          <button type="submit" className="btn-principal" disabled={envoi}>Enregistrer</button>
        </div>
      </form>
    </div>
  )
}