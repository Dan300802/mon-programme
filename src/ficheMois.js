import { supabase } from './lib/supabase'
import { exporterMois } from './exportMensuel'

// mois au format "2026-11"
export async function telechargerFicheMois(mois) {
  const [annee, numMois] = mois.split('-').map(Number)
  const debut = new Date(annee, numMois - 1, 1)
  const fin = new Date(annee, numMois, 1)
  const moisLabel = debut
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase())

  const { data: taches, error: e1 } = await supabase
    .from('programmes')
    .select('*')
    .eq('statut', 'fait')
    .gte('date_realisation', debut.toISOString())
    .lt('date_realisation', fin.toISOString())
    .order('date_realisation')
  if (e1) throw e1

  const { data: releves, error: e2 } = await supabase
    .from('releves')
    .select('*, mesures_routeur(*), signalements(*)')
    .gte('date_releve', debut.toLocaleDateString('en-CA'))
    .lt('date_releve', fin.toLocaleDateString('en-CA'))
    .order('date_releve')
  if (e2) throw e2

  if (taches.length === 0 && releves.length === 0) {
    throw new Error('Aucune tâche réalisée ni relevé pour ce mois.')
  }

  await exporterMois({ moisISO: mois, moisLabel, taches, releves })
}