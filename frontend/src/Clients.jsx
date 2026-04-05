import { useState, useEffect } from 'react'
import api from './api'
const vide = {nom:'',adresse:'',ville:'',pays:'',email:'',telephone:'',ice:'',devise:'CAD',langue:'fr'}
const S = {padding:'8px',border:'1px solid #ddd',borderRadius:'4px',width:'100%',fontSize:'13px',boxSizing:'border-box'}
export default function Clients() {
  const [clients,setClients] = useState([])
  const [form,setForm] = useState(null)
  const [edit,setEdit] = useState(null)
  const [recherche,setRecherche] = useState('')
  const charger = () => api.get('/clients').then(r=>setClients(r.data))
  useEffect(()=>{charger()},[])
  const sauvegarder = async () => {
    if (edit) await api.put('/clients/'+edit,form)
    else await api.post('/clients',form)
    setForm(null); setEdit(null); charger()
  }
  const supprimer = async id => {
    if (!confirm('Supprimer ce client ?')) return
    await api.delete('/clients/'+id); charger()
  }
  const filtres = clients.filter(c => {
    const q = recherche.toLowerCase()
    return !q || c.nom.toLowerCase().includes(q) || (c.ville||'').toLowerCase().includes(q) || (c.pays||'').toLowerCase().includes(q)
  })
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{margin:0,color:'#1a1a2e'}}>Clients</h2>
        <button onClick={()=>{setForm(vide);setEdit(null)}} style={{background:'#e91e8c',color:'white',border:'none',padding:'10px 20px',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>+ Nouveau client</button>
      </div>
      {form && (
        <div style={{background:'white',padding:'24px',borderRadius:'8px',marginBottom:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
          <h3 style={{margin:'0 0 16px',color:'#1a1a2e'}}>{edit?'Modifier':'Nouveau'} client</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            {[['nom','Nom *'],['adresse','Adresse'],['ville','Ville'],['pays','Pays'],['email','Email'],['telephone','Telephone'],['ice','ICE']].map(([k,l])=>(
              <div key={k}>
                <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>{l}</label>
                <input style={S} value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'4px'}}>Devise</label>
              <select style={S} value={form.devise} onChange={e=>setForm({...form,devise:e.target.value})}>
                <option>CAD</option><option>EUR</option><option>DH</option><option>USD</option>
              </select>
            </div>
          </div>
          <div style={{marginTop:'16px',display:'flex',gap:'10px'}}>
            <button onClick={sauvegarder} style={{background:'#e91e8c',color:'white',border:'none',padding:'10px 24px',borderRadius:'4px',cursor:'pointer',fontWeight:'bold'}}>Sauvegarder</button>
            <button onClick={()=>{setForm(null);setEdit(null)}} style={{background:'#eee',border:'none',padding:'10px 24px',borderRadius:'4px',cursor:'pointer'}}>Annuler</button>
          </div>
        </div>
      )}
      <div style={{marginBottom:'16px'}}>
        <input placeholder="Rechercher un client..." value={recherche} onChange={e=>setRecherche(e.target.value)}
          style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px',boxSizing:'border-box'}}/>
      </div>
      <div style={{background:'white',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f8f8f8'}}>
            {['Nom','Ville','Pays','Telephone','Devise','Actions'].map(h=>(
              <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:'12px',color:'#666',fontWeight:'600',borderBottom:'1px solid #eee'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtres.map((c,i)=>(
              <tr key={c.id} style={{background:i%2===0?'white':'#fafafa'}}>
                <td style={{padding:'12px 16px',fontSize:'14px',fontWeight:'500'}}>{c.nom}</td>
                <td style={{padding:'12px 16px',fontSize:'13px',color:'#666'}}>{c.ville}</td>
                <td style={{padding:'12px 16px',fontSize:'13px',color:'#666'}}>{c.pays}</td>
                <td style={{padding:'12px 16px',fontSize:'13px',color:'#666'}}>{c.telephone}</td>
                <td style={{padding:'12px 16px'}}><span style={{background:'#f0f0f0',padding:'2px 8px',borderRadius:'10px',fontSize:'12px'}}>{c.devise}</span></td>
                <td style={{padding:'12px 16px',display:'flex',gap:'6px'}}>
                  <button onClick={()=>{setForm(c);setEdit(c.id)}} style={{background:'#1a1a2e',color:'white',border:'none',padding:'5px 12px',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>Modifier</button>
                  <button onClick={()=>supprimer(c.id)} style={{background:'#fee',color:'#e11',border:'1px solid #fcc',padding:'5px 12px',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtres.length===0 && <div style={{textAlign:'center',padding:'40px',color:'#aaa'}}>Aucun client</div>}
      </div>
    </div>
  )
}
