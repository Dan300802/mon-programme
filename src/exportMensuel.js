import ExcelJS from 'exceljs'

const ETATS = { normal: 'Normal', faible: 'Faible', panne: 'Panne' }
const SIGNALEMENTS = { panne: 'Panne', demande_client: 'Demande client' }
const AUCUNE = 'Aucune donnée'

const jourFr = (iso) => iso.split('-').reverse().join('/')
const dateFr = (ts) => new Date(ts).toLocaleDateString('fr-FR')
const heureFr = (ts) =>
  new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const jourSemaine = (ts) =>
  new Date(ts)
    .toLocaleDateString('fr-FR', { weekday: 'long' })
    .replace(/^./, (c) => c.toUpperCase())
const jourISO = (ts) => new Date(ts).toLocaleDateString('en-CA')

function ecartJours(realiseeISO, prevueISO) {
  const a = new Date(realiseeISO + 'T00:00:00')
  const b = new Date(prevueISO + 'T00:00:00')
  return Math.round((a - b) / 86400000)
}

function libelleDelai(ecart) {
  return ecart <= 0 ? 'Dans les délais' : `En retard de ${ecart} jour${ecart > 1 ? 's' : ''}`
}

function ajouterFeuille(wb, nom, colonnes, lignes) {
  const ws = wb.addWorksheet(nom)
  ws.columns = colonnes
  lignes.forEach((l) => ws.addRow(l))
  const entete = ws.getRow(1)
  entete.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  entete.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  return ws
}

export async function exporterMois({ moisISO, moisLabel, taches, releves }) {
  const wb = new ExcelJS.Workbook()

  // Tâches enrichies
  const detail = taches.map((t, i) => {
    const jour = jourISO(t.date_realisation)
    const ecart = ecartJours(jour, t.date_prevue)
    return { t, i, jour, ecart }
  })
  const dansLesDelais = detail.filter((d) => d.ecart <= 0).length
  const enRetard = detail.length - dansLesDelais

  const mesures = releves.flatMap((r) => r.mesures_routeur)
  const debits = mesures.map((m) => Number(m.debit_mbps))
  const signalements = releves.flatMap((r) =>
    r.signalements.map((s) => ({ ...s, station: r.station, date: r.date_releve }))
  )
  const pannes = signalements.filter((s) => s.type === 'panne')
  const demandes = signalements.filter((s) => s.type === 'demande_client')
  const stations = new Set(releves.map((r) => r.station.trim().toLowerCase()))
  const moyenne = debits.length
    ? Number((debits.reduce((a, b) => a + b, 0) / debits.length).toFixed(1))
    : AUCUNE

  // 1. Résumé
  ajouterFeuille(
    wb,
    'Résumé',
    [
      { header: 'Indicateur', key: 'indicateur', width: 38 },
      { header: 'Valeur', key: 'valeur', width: 20 },
    ],
    [
      { indicateur: 'Mois', valeur: moisLabel },
      { indicateur: 'Tâches réalisées', valeur: taches.length },
      { indicateur: 'dont tâches urgentes', valeur: taches.filter((t) => t.urgent).length },
      { indicateur: 'dont rendez-vous tenus', valeur: taches.filter((t) => t.type === 'rendez-vous').length },
      { indicateur: 'Tâches réalisées dans les délais', valeur: dansLesDelais },
      { indicateur: 'Tâches réalisées en retard', valeur: enRetard },
      { indicateur: 'Jours avec au moins une tâche réalisée', valeur: new Set(detail.map((d) => d.jour)).size },
      { indicateur: 'Relevés de monitoring', valeur: releves.length },
      { indicateur: 'Stations visitées', valeur: stations.size },
      { indicateur: 'Routeurs mesurés', valeur: mesures.length },
      { indicateur: 'Débit moyen (Mbit/s)', valeur: moyenne },
      { indicateur: 'Débit minimum (Mbit/s)', valeur: debits.length ? Math.min(...debits) : AUCUNE },
      { indicateur: 'Débit maximum (Mbit/s)', valeur: debits.length ? Math.max(...debits) : AUCUNE },
      { indicateur: 'Routeurs en débit faible', valeur: mesures.filter((m) => m.etat === 'faible').length },
      { indicateur: 'Routeurs en panne', valeur: mesures.filter((m) => m.etat === 'panne').length },
      { indicateur: 'Pannes notifiées', valeur: pannes.length },
      { indicateur: 'Demandes des clients', valeur: demandes.length },
    ]
  )

  // 2. Tâches réalisées (détaillé)
  const wsTaches = ajouterFeuille(
    wb,
    'Tâches réalisées',
    [
      { header: 'N°', key: 'n', width: 6 },
      { header: 'Date de réalisation', key: 'date', width: 20 },
      { header: 'Jour', key: 'jour', width: 12 },
      { header: 'Heure de réalisation', key: 'heure', width: 20 },
      { header: 'Tâche', key: 'titre', width: 44 },
      { header: 'Détails', key: 'details', width: 54 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Urgent', key: 'urgent', width: 10 },
      { header: 'Date prévue', key: 'prevue', width: 14 },
      { header: 'Heure prévue', key: 'heurePrevue', width: 14 },
      { header: 'Respect du délai', key: 'delai', width: 24 },
    ],
    detail.map(({ t, i, ecart }) => ({
      n: i + 1,
      date: dateFr(t.date_realisation),
      jour: jourSemaine(t.date_realisation),
      heure: heureFr(t.date_realisation),
      titre: t.titre,
      details: t.description || '',
      type: t.type === 'rendez-vous' ? 'Rendez-vous' : 'Tâche',
      urgent: t.urgent ? 'Oui' : 'Non',
      prevue: jourFr(t.date_prevue),
      heurePrevue: t.heure ? t.heure.slice(0, 5) : '',
      delai: libelleDelai(ecart),
    }))
  )
  wsTaches.getColumn('details').alignment = { wrapText: true, vertical: 'top' }
  wsTaches.getColumn('titre').alignment = { wrapText: true, vertical: 'top' }
  wsTaches.autoFilter = { from: 'A1', to: 'K1' }

  // 3. Activité par jour
  const parJour = new Map()
  detail.forEach((d) => {
    const x = parJour.get(d.jour) || { total: 0, urgentes: 0, retard: 0, ts: d.t.date_realisation }
    x.total += 1
    if (d.t.urgent) x.urgentes += 1
    if (d.ecart > 0) x.retard += 1
    parJour.set(d.jour, x)
  })
  ajouterFeuille(
    wb,
    'Activité par jour',
    [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Jour', key: 'jour', width: 12 },
      { header: 'Tâches réalisées', key: 'total', width: 18 },
      { header: 'dont urgentes', key: 'urgentes', width: 16 },
      { header: 'dont en retard', key: 'retard', width: 16 },
    ],
    [...parJour.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([iso, x]) => ({
        date: jourFr(iso),
        jour: jourSemaine(x.ts),
        total: x.total,
        urgentes: x.urgentes,
        retard: x.retard,
      }))
  )

  // 4. Monitoring
  const wsMon = ajouterFeuille(
    wb,
    'Monitoring',
    [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Heure', key: 'heure', width: 10 },
      { header: 'Station', key: 'station', width: 26 },
      { header: 'Routeur', key: 'routeur', width: 12 },
      { header: 'Débit (Mbit/s)', key: 'debit', width: 16 },
      { header: 'État', key: 'etat', width: 12 },
    ],
    releves.flatMap((r) =>
      [...r.mesures_routeur]
        .sort((a, b) => a.numero - b.numero)
        .map((m) => ({
          date: jourFr(r.date_releve),
          heure: heureFr(r.created_at),
          station: r.station,
          routeur: `Routeur ${m.numero}`,
          debit: Number(m.debit_mbps),
          etat: ETATS[m.etat],
        }))
    )
  )
  wsMon.getColumn('debit').numFmt = '0.00'

  // 5. Signalements
  ajouterFeuille(
    wb,
    'Signalements',
    [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Station', key: 'station', width: 26 },
      { header: 'Type', key: 'type', width: 18 },
      { header: 'Détails', key: 'details', width: 50 },
    ],
    signalements.map((s) => ({
      date: jourFr(s.date),
      station: s.station,
      type: SIGNALEMENTS[s.type],
      details: s.details || '',
    }))
  )

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fiche-mensuelle-${moisISO}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}