import { useState } from 'react'
import api from './api'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@4usit.com')
  const [mdp, setMdp] = useState('')
  const [err, setErr] = useState('')

  const submit = async e => {
    e.preventDefault()
    try {
      const r = await api.post('/auth/login', { email, mot_de_passe: mdp })
      localStorage.setItem('token', r.data.token)
      localStorage.setItem('user', JSON.stringify(r.data.user))
      onLogin(r.data.user)
    } catch { setErr('Email ou mot de passe incorrect') }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', padding:'40px', borderRadius:'8px', boxShadow:'0 2px 20px rgba(0,0,0,0.1)', width:'360px' }}>
        <div style={{ textAlign:'center', marginBottom:'30px' }}>
          <div style={{ fontSize:'36px', fontWeight:'bold' }}>4<span style={{ color:'#e91e8c' }}>US</span>iT</div>
          <div style={{ color:'#666', marginTop:'8px' }}>Gestion de facturation</div>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom:'16px' }}>
            <label style={{ display:'block', marginBottom:'6px', fontSize:'13px', color:'#555' }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)}
              style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:'20px' }}>
            <label style={{ display:'block', marginBottom:'6px', fontSize:'13px', color:'#555' }}>Mot de passe</label>
            <input type="password" value={mdp} onChange={e => setMdp(e.target.value)}
              style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'14px', boxSizing:'border-box' }} />
          </div>
          {err && <div style={{ color:'red', fontSize:'13px', marginBottom:'12px' }}>{err}</div>}
          <button type="submit"
            style={{ width:'100%', padding:'12px', background:'#e91e8c', color:'white', border:'none', borderRadius:'4px', fontSize:'15px', fontWeight:'bold', cursor:'pointer' }}>
            Connexion
          </button>
        </form>
      </div>
    </div>
  )
}
