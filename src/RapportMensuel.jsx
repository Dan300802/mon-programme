import { useState } from 'react'
import { telechargerFicheMois } from './ficheMois'

const FEUILLES = [
  'Résumé : chiffres clés du mois',
  'Tâches réalisées : date, heure, détails, respect du délai',
  'Activité par jour : tâches réalisées chaque jour',
  'Monitoring : débit et état de chaque routeur',
  'Signalements : pannes et demandes des clients',
]

export default function RapportMensuel() {
  const [mois, setMois] = useState(() => new Date().toLocaleDateString('en-CA').slice(0, 7))
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [copie, setCopie] = useState(false)

  const [annee, numMois] = mois.split('-').map(Number)
  const debut = new Date(annee, numMois - 1, 1)
  const fin = new Date(annee, numMois, 1)
  const moisLabel = debut
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase())

  const consigne =
    `Voici la fiche Excel d'activité du mois de ${moisLabel} (fichier joint). ` +
    `À partir de ce fichier uniquement, génère une présentation PowerPoint de rapport mensuel : ` +
    `page de titre, résumé du mois avec les chiffres clés, tâches réalisées, ` +
    `monitoring des stations (débits, pannes, demandes des clients) et recommandations. ` +
    `N'invente aucun chiffre et indique clairement les données manquantes.`

  async function telecharger() {
  setEnvoi(true)
  setErreur(null)
  try {
    await telechargerFicheMois(mois)
  } catch (e) {
    setErreur(e.message)
  } finally {
    setEnvoi(false)
  }
}

  async function copier() {
    try {
      await navigator.clipboard.writeText(consigne)
      setCopie(true)
      setTimeout(() => setCopie(false), 2500)
    } catch {
      setErreur('Copie impossible : sélectionne le texte manuellement.')
    }
  }

  return (
    <section className="bloc rapport">
      <h2>Fiche mensuelle Excel</h2>
      <p className="vide">
        Téléchargez le résumé de tout ce que vous avez fait pendant le mois, puis envoyez-le à votre IA
        pour générer le PowerPoint.
      </p>

      <div className="rapport-grille">
        <div>
          <div className="champ">
            <label htmlFor="rap-mois">Mois</label>
            <input id="rap-mois" type="month" value={mois} onChange={(e) => setMois(e.target.value)} />
          </div>

          {erreur && <p className="msg-erreur" role="alert">{erreur}</p>}

          <div className="rapport-actions">
            <button className="btn-principal" onClick={telecharger} disabled={envoi || !mois}>
              {envoi ? 'Préparation…' : 'Télécharger la fiche du mois'}
            </button>
            <button className="btn-sec" onClick={copier}>
              {copie ? 'Consigne copiée' : 'Copier la consigne pour l’IA'}
            </button>
          </div>
        </div>

        <div>
          <div className="lbl-apercu">Contenu de la fiche</div>
          <ol className="apercu">
            {FEUILLES.map((f, i) => (
              <li key={f}><span>{i + 1}</span>{f}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}