import { useState } from 'react'
import { supabase } from './lib/supabase'
import ReseauAnime from './ReseauAnime'
import './Public.css'

function traduire(message) {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Email ou mot de passe incorrect.'
  if (m.includes('already registered')) return 'Un compte existe déjà avec cet email.'
  if (m.includes('email not confirmed')) return 'Confirmez d’abord votre email avec le lien reçu.'
  if (m.includes('rate limit')) return 'Trop de tentatives. Réessayez dans quelques minutes.'
  if (m.includes('password')) return 'Mot de passe refusé : utilisez au moins 8 caractères.'
  return message
}

export default function Auth({ mode, onChangerMode, onRetour }) {
  const inscription = mode === 'inscription'
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [voir, setVoir] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [info, setInfo] = useState(null)

  async function soumettre(e) {
    e.preventDefault()
    setErreur(null)
    setInfo(null)
    if (inscription && mdp.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setEnvoi(true)
    if (inscription) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: mdp,
        options: { data: { full_name: nom.trim() } },
      })
      if (error) setErreur(traduire(error.message))
      else if (!data.session)
        setInfo('Compte créé. Un email de confirmation vient d’être envoyé : cliquez sur le lien, puis connectez-vous.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: mdp,
      })
      if (error) setErreur(traduire(error.message))
    }
    setEnvoi(false)
  }

  return (
    <div className="au">
      <div className="au-fond"><ReseauAnime /></div>
      <button className="au-retour" onClick={onRetour}>← Retour à l’accueil</button>

      <form className="au-carte" onSubmit={soumettre}>
        <div className="au-icone" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1>{inscription ? 'Créer votre compte' : 'Bon retour'}</h1>
        <p className="au-sous">
          {inscription
            ? 'Quelques secondes suffisent pour commencer.'
            : 'Connectez-vous pour retrouver votre programme.'}
        </p>

        {inscription && (
          <div className="au-champ">
            <label htmlFor="nom">Nom complet</label>
            <input id="nom" type="text" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} required />
          </div>
        )}

        <div className="au-champ">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="au-champ">
          <label htmlFor="mdp">Mot de passe</label>
          <div className="au-mdp">
            <input
              id="mdp"
              type={voir ? 'text' : 'password'}
              autoComplete={inscription ? 'new-password' : 'current-password'}
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              required
            />
            <button
              type="button"
              className="au-oeil"
              onClick={() => setVoir(!voir)}
              aria-pressed={voir}
              aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {voir ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          {inscription && <span className="au-aide">8 caractères minimum</span>}
        </div>

        {erreur && <p className="au-erreur" role="alert">{erreur}</p>}
        {info && <p className="au-info" role="status">{info}</p>}

        <button type="submit" className="lp-btn lp-btn-grand au-valider" disabled={envoi}>
          {envoi ? 'Patientez…' : inscription ? 'Créer mon compte' : 'Se connecter'}
        </button>

        <p className="au-bas">
          {inscription ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
          <button type="button" className="au-lien" onClick={onChangerMode}>
            {inscription ? 'Se connecter' : 'Créer un compte'}
          </button>
        </p>
      </form>
    </div>
  )
}