import { useState, useEffect } from 'react'
import api from './api'

const ligneVide = { description:'', quantite:1, prix_unitaire:0 }

export default function FactureForm({ id, onNav }) {
  const [clients, setClients] = useState([])
  const [modeles, setModeles] = useState([])
  const [form, setForm] = useState({
    client_id:'', modele_id:'', date_facture: new Date().toISOString().split('T')[0],
    date_echeance:'', reference:'', taux_tva:0, devise:'CAD', notes:'', conditions:'30 jours',
    lignes:[{ ...ligneVide }]
  })
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data))
    api.get('/modeles').then(r => setModeles(r.data))
    if (id) {
      api.get(`/factures/${id}`).then(r => {
        const f = r.data
        setForm({
          client_id: f.client_id, modele_id: f.modele_id,
          date_facture: f.date_facture?.split('T')[0]||'',
          date_echeance: f.date_echeance?.split('T')[0]||'',
          reference: f.reference||'', taux_tva: f.taux_tva||0,
          devise: f.devise||'CAD', notes: f.notes||'', conditions: f.conditions||'30 jours',
          lignes: f.lignes.length ? f.lignes : [{ ...ligneVide }],
          statut: f.statut
        })
      })
    }
  }, [id])

  // Auto-remplir devise selon client
  useEffect(() => {
    const c = clients.find(x => x.id === form.client_id)
    if (c) setForm(f => ({ ...f, devise: c.devise || 'CAD' }))
  }, [form.client_id, clients])

  const setLigne = (i, k, v) => {
    const ls = [...form.lignes]
    ls[i] = { ...ls[i], [k]: v }
    setForm({ ...form, lignes: ls })
  }

  const ajouterLigne = () => setForm({ ...form, lignes: [...form.lignes, { ...ligneVide }] })
  const supprimerLigne = i => setForm({ ...form, lignes: form.lignes.filter((_,j) => j!==i) })

  const sousTot = form.lignes.reduce((s,l) => s + (parseFloat(l.quantite)||0)*(parseFloat(l.prix_unitaire)||0), 0)
  const tva = sousTot * (parseFloat(form.taux_tva)||0) / 100
  const total = sousTot + tva
  const fmt = n => parseFloat(n||0).toFixed(2)

  const sauvegarder = async () => {
    if (!form.client_id || !form.modele_id) return setMsg('Client et modèle obligatoires')
    try {
      if (id) await api.put(`/factures/${id}`, form)
      else await api.post('/factures', form)
      onNav('factures')
    } catch(e) { setMsg(e.response?.data?.error || 'Erreur') }
  }

  const s = { padding:'8px', border:'1px solid #ddd', borderRadius:'4px', fontSize:'13px', width:'100%', boxSizing:'border-box' }

  return (
    <div style={{ maxWidth:'900px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h2 style={{ margin:0, color:'#1a1a2e' }}>{id ? 'Modifier' : 'Nouvelle'} facture</h2>
        <button onClick={() => onNav('factures')}
          style={{ background:'#eee', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer' }}>
          ← Retour
        </button>
      </div>

      <div style={{ background:'white', borderRadius:'8px', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:'16px' }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'14px', color:'#555', textTransform:'uppercase' }}>Informations générales</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Client *</label>
            <select style={s} value={form.client_id} onChange={e => setForm({...form,client_id:e.target.value})}>
              <option value="">— Choisir un client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Modèle *</label>
            <select style={s} value={form.modele_id} onChange={e => setForm({...form,modele_id:e.target.value})}>
              <option value="">— Choisir un modèle —</option>
              {modeles.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Date facture</label>
            <input type="date" style={s} value={form.date_facture} onChange={e => setForm({...form,date_facture:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Date échéance</label>
            <input type="date" style={s} value={form.date_echeance} onChange={e => setForm({...form,date_echeance:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Référence</label>
            <input style={s} value={form.reference} onChange={e => setForm({...form,reference:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Devise</label>
            <select style={s} value={form.devise} onChange={e => setForm({...form,devise:e.target.value})}>
              <option>CAD</option><option>EUR</option><option>DH</option><option>USD</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>TVA (%)</label>
            <input type="number" style={s} value={form.taux_tva} onChange={e => setForm({...form,taux_tva:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Conditions</label>
            <input style={s} value={form.conditions} onChange={e => setForm({...form,conditions:e.target.value})} />
          </div>
        </div>
      </div>

      {/* Lignes */}
      <div style={{ background:'white', borderRadius:'8px', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:'16px' }}>
        <h3 style={{ margin:'0 0 16px', fontSize:'14px', color:'#555', textTransform:'uppercase' }}>Lignes de facturation</h3>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f8f8f8' }}>
              {['Description','Qté','Prix unit.','Total',''].map(h => (
                <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:'12px', color:'#666', borderBottom:'1px solid #eee' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {form.lignes.map((l,i) => (
              <tr key={i}>
                <td style={{ padding:'6px 4px' }}>
                  <input style={{...s,width:'100%'}} value={l.description} onChange={e => setLigne(i,'description',e.target.value)} placeholder="Description..." />
                </td>
                <td style={{ padding:'6px 4px', width:'70px' }}>
                  <input type="number" style={s} value={l.quantite} onChange={e => setLigne(i,'quantite',e.target.value)} />
                </td>
                <td style={{ padding:'6px 4px', width:'130px' }}>
                  <input type="number" step="0.01" style={s} value={l.prix_unitaire} onChange={e => setLigne(i,'prix_unitaire',e.target.value)} />
                </td>
                <td style={{ padding:'6px 10px', fontWeight:'600', fontSize:'13px', width:'120px' }}>
                  {fmt((parseFloat(l.quantite)||0)*(parseFloat(l.prix_unitaire)||0))} {form.devise}
                </td>
                <td style={{ padding:'6px 4px', width:'40px' }}>
                  {form.lignes.length > 1 &&
                    <button onClick={() => supprimerLigne(i)}
                      style={{ background:'#fee', color:'#e11', border:'none', borderRadius:'4px', cursor:'pointer', padding:'4px 8px', fontSize:'14px' }}>×</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={ajouterLigne}
          style={{ marginTop:'10px', background:'transparent', border:'1px dashed #ccc', padding:'8px 20px', borderRadius:'4px', cursor:'pointer', color:'#888', fontSize:'13px' }}>
          + Ajouter une ligne
        </button>

        {/* Totaux */}
        <div style={{ float:'right', width:'280px', marginTop:'16px' }}>
          {[['Sous-total', `${fmt(sousTot)} ${form.devise}`],
            [`TVA ${form.taux_tva}%`, `${fmt(tva)} ${form.devise}`]].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:'13px', borderBottom:'1px solid #eee' }}>
              <span style={{ color:'#666' }}>{k}</span><span>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', fontSize:'16px', fontWeight:'bold', color:'#1a1a2e' }}>
            <span>Total</span><span>{fmt(total)} {form.devise}</span>
          </div>
        </div>
        <div style={{ clear:'both' }} />
      </div>

      {/* Notes */}
      <div style={{ background:'white', borderRadius:'8px', padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:'16px' }}>
        <label style={{ fontSize:'12px', color:'#666', display:'block', marginBottom:'4px' }}>Notes</label>
        <textarea style={{...s,height:'80px',resize:'vertical'}} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} />
      </div>

      {msg && <div style={{ color:'red', marginBottom:'12px', fontSize:'13px' }}>{msg}</div>}

      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={sauvegarder}
          style={{ background:'#e91e8c', color:'white', border:'none', padding:'12px 30px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold', fontSize:'15px' }}>
          {id ? 'Mettre à jour' : 'Créer la facture'}
        </button>
        <button onClick={() => onNav('factures')}
          style={{ background:'#eee', border:'none', padding:'12px 24px', borderRadius:'6px', cursor:'pointer', fontSize:'14px' }}>
          Annuler
        </button>
      </div>
    </div>
  )
}
