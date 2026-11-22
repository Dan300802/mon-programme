import ExcelJS from 'exceljs'

const ETATS = { normal: 'Normal', faible: 'Faible', panne: 'Panne' }
const SIGNALEMENTS = { panne: 'Panne', demande_client: 'Demande client' }

export async function exporterReleves(releves, dateISO) {
  const [annee, mois, jour] = dateISO.split('-')

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Relevés')

  ws.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Heure', key: 'heure', width: 10 },
    { header: 'Station', key: 'station', width: 24 },
    { header: 'Routeur', key: 'routeur', width: 12 },
    { header: 'Débit (Mbit/s)', key: 'debit', width: 16 },
    { header: 'État', key: 'etat', width: 12 },
    { header: 'Signalement', key: 'type', width: 18 },
    { header: 'Détails', key: 'details', width: 40 },
  ]

  for (const r of releves) {
    const heure = new Date(r.created_at).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const type = r.signalements.map((s) => SIGNALEMENTS[s.type]).join(' ; ')
    const details = r.signalements.map((s) => s.details).filter(Boolean).join(' ; ')

    for (const m of [...r.mesures_routeur].sort((a, b) => a.numero - b.numero)) {
      ws.addRow({
        date: `${jour}/${mois}/${annee}`,
        heure,
        station: r.station,
        routeur: `Routeur ${m.numero}`,
        debit: Number(m.debit_mbps),
        etat: ETATS[m.etat],
        type,
        details,
      })
    }
  }

  // Mise en forme : en-tête en gras, ligne figée, filtres, débit à 2 décimales
  const entete = ws.getRow(1)
  entete.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  entete.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: 'A1', to: 'H1' }
  ws.getColumn('debit').numFmt = '0.00'

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `monitoring-${dateISO}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}