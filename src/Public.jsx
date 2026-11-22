import { useEffect, useState } from 'react'
import Landing from './Landing'
import Auth from './Auth'

export default function Public() {
  const [ecran, setEcran] = useState('landing')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [ecran])

  if (ecran === 'landing') {
    return (
      <Landing
        onConnexion={() => setEcran('connexion')}
        onInscription={() => setEcran('inscription')}
      />
    )
  }

  return (
    <Auth
      key={ecran}
      mode={ecran}
      onChangerMode={() => setEcran(ecran === 'connexion' ? 'inscription' : 'connexion')}
      onRetour={() => setEcran('landing')}
    />
  )
}