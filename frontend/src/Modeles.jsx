import { useState, useEffect } from 'react'
import api from './api'

const vide = { nom:'', description:'', style:{ type:'ADVEN', couleur:'#e91e8c' } }

export default function Modeles() {
  const [modeles, setModeles] = useState([])
  const [form, setForm] = useState(null)
  const [edit, setEdit] = useState(null)

  const charger = () => api.get('/modeles').then(r => setModeles(r.data))
  useEffect(() => { charger() }, [])

  const sauvegarder = async () => {
    if (edit) await api.put(`/modeles/${edit}`, form)
    else await api.post('/modeles', form)
    setForm(null); setEdit(null); charger()
  }

  const s = { padding:'8px', border:'1px solid #ddd', borderRadius:'4px', width:'100%', fontSize:'13px', boxSizing:'border-box' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 style={{ margin:0, color:'#1a1a2e' }}>Modèles de facture</h2>
        <button onClick={() => { setForm(vide); setEdit(null) }}
          style={{ background:'#e91e8c', color:'white', border:'none', padding:'10px 20px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold' }}>
          + Nouveau modèle
        </button>
      </div>

      {form && (
        <div style={{ background:'white', padding:'24px', borderRadius:'8px', marginBottom:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin:'0 0 16px', color:'#1a1a2e' }}>{edit ? 'Modifier' : 'Nouveau'} modèle</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Nom *</label>
              <input style={s} value={form.nom} onChange={e => setForm({...form,nom:e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Type</label>
              <select style={s} value={form.style?.type||'ADVEN'}
                onChange={e => setForm({...form,style:{...form.style,type:e.target.value}})}>
                <option value="ADVEN">ADVEN (style Québec)</option>
                <option value="FCZ">FCZ (style Maroc)</option>
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Description</label>
              <textarea style={{...s,height:'60px',resize:'vertical'}} value={form.description||''}
                onChange={e => setForm({...form,description:e.target.value})} />
            </div>
          </div>
          <div style={{ marginTop:'16px', display:'flex', gap:'10px' }}>
            <button onClick={sauvegarder}
              style={{ background:'#e91e8c', color:'white', border:'none', padding:'10px 24px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold' }}>
              Sauvegarder
            </button>
            <button onClick={() => { setForm(null); setEdit(null) }}
              style={{ background:'#eee', border:'none', padding:'10px 24px', borderRadius:'4px', cursor:'pointer' }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'16px' }}>
        {modeles.map(m => (
          <div key={m.id} style={{ background:'white', borderRadius:'8px', padding:'20px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', borderTop:`4px solid ${m.style?.couleur||'#e91e8c'}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:'bold', fontSize:'15px', color:'#1a1a2e' }}>{m.nom}</div>
                <div style={{ fontSize:'12px', color:'#888', marginTop:'4px' }}>{m.description}</div>
                <span style={{ display:'inline-block', marginTop:'8px', background:'#f0f0f0', padding:'2px 8px', borderRadius:'10px', fontSize:'11px' }}>
                  {m.style?.type||'ADVEN'}
                </span>
              </div>
              <button onClick={() => { setForm({...m,style:m.style||{}}); setEdit(m.id) }}
                style={{ background:'#1a1a2e', color:'white', border:'none', padding:'5px 12px', borderRadius:'4px', cursor:'pointer', fontSize:'12px' }}>
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
      {modeles.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:'#aaa' }}>Aucun modèle</div>}
    </div>
  )
}
