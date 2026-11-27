import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Accueil from './Accueil'
import Monitoring from './Monitoring'
import Navigation from './Navigation'
import Public from './Public'
import './App.css'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = chargement
  const [vue, setVue] = useState('accueil')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_evenement, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  function changer(v) {
    setVue(v)
    window.scrollTo(0, 0)
  }

  if (session === undefined) {
    return <div className="chargement" role="status">Chargement…</div>
  }
  if (!session) return <Public />

  const nom = session.user.user_metadata?.full_name ?? ''
  const prenom = nom.split(' ')[0]

  return (
    <>
      <Navigation
        vue={vue}
        onChange={changer}
        nom={nom}
        email={session.user.email}
        onDeconnexion={() => supabase.auth.signOut()}
      />
      <main className="page">
       {vue === 'accueil' ? (
  <Accueil prenom={prenom} onMonitoring={() => changer('monitoring')} />
) : (
  <Monitoring />
)}
      </main>
    </>
  )
}