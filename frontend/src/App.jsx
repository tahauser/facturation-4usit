import { useState, useEffect } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import Clients from './Clients'
import Modeles from './Modeles'
import Factures from './Factures'
import FactureForm from './FactureForm'
import FactureDetail from './FactureDetail'

export default function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [factureId, setFactureId] = useState(null)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (u) setUser(JSON.parse(u))
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (!user) return <Login onLogin={u => setUser(u)} />

  const nav = (p, id=null) => { setPage(p); setFactureId(id) }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5', fontFamily:'Arial,sans-serif' }}>
      {/* Navbar */}
      <div style={{ background:'#1a1a2e', padding:'0 30px', display:'flex', alignItems:'center', gap:'30px', height:'56px' }}>
        <div style={{ fontSize:'22px', fontWeight:'bold', color:'white', marginRight:'20px' }}>
          4<span style={{ color:'#e91e8c' }}>US</span>iT
        </div>
        {[['dashboard','📊 Dashboard'],['factures','🧾 Factures'],['clients','👥 Clients'],['modeles','🎨 Modèles']].map(([p,l]) => (
          <button key={p} onClick={() => nav(p)}
            style={{ background: page===p ? '#e91e8c' : 'transparent', color:'white', border:'none',
              padding:'8px 16px', borderRadius:'4px', cursor:'pointer', fontSize:'14px' }}>
            {l}
          </button>
        ))}
        <div style={{ marginLeft:'auto', color:'#aaa', fontSize:'13px' }}>
          {user.nom} &nbsp;
          <button onClick={logout} style={{ background:'transparent', color:'#e91e8c', border:'1px solid #e91e8c', padding:'4px 12px', borderRadius:'4px', cursor:'pointer', fontSize:'12px' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding:'30px' }}>
        {page === 'dashboard' && <Dashboard onNav={nav} />}
        {page === 'clients' && <Clients />}
        {page === 'modeles' && <Modeles />}
        {page === 'factures' && <Factures onNav={nav} />}
        {page === 'nouvelle-facture' && <FactureForm onNav={nav} />}
        {page === 'modifier-facture' && <FactureForm id={factureId} onNav={nav} />}
        {page === 'detail-facture' && <FactureDetail id={factureId} onNav={nav} />}
      </div>
    </div>
  )
}
