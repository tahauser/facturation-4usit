import { useState, useEffect } from 'react'
import api from './api'
const STATUTS = {brouillon:'#94a3b8',envoyee:'#f59e0b',payee:'#10b981',annulee:'#ef4444'}
const LABELS = {brouillon:'Brouillon',envoyee:'Envoyee',payee:'Payee',annulee:'Annulee'}
export default function Factures({onNav}) {
  const [factures,setFactures] = useState([])
  const [filtre,setFiltre] = useState('tous')
  const [recherche,setRecherche] = useState('')
  const charger = () => api.get('/factures').then(r=>setFactures(r.data))
  useEffect(()=>{charger()},[])
  const changer = async (id,statut) => { await api.patch('/factures/'+id+'/statut',{statut}); charger() }
  const supprimer = async id => {
    if (!confirm('Supprimer cette facture ?')) return
    await api.delete('/factures/'+id); charger()
  }
  const ouvrirPdf = id => {
    const t = localStorage.getItem('token')
    window.open('/api/factures/'+id+'/pdf?token='+t,'_blank')
  }
  const fmt = (n,d) => n ? parseFloat(n).toLocaleString('fr-FR',{minimumFractionDigits:2})+' '+(d||'CAD') : '—'
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
  const filtrees = factures.filter(f => {
    const okStatut = filtre==='tous' || (filtre==='non_payee' ? f.statut==='envoyee' : f.statut===filtre)
    const q = recherche.toLowerCase()
    const okR = !q || f.numero.toLowerCase().includes(q) || f.client_nom.toLowerCase().includes(q) || (f.reference||'').toLowerCase().includes(q)
    return okStatut && okR
  })
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{margin:0,color:'#1a1a2e'}}>Factures</h2>
        <button onClick={()=>onNav('nouvelle-facture')} style={{background:'#e91e8c',color:'white',border:'none',padding:'10px 20px',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>+ Nouvelle facture</button>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
        {[['tous','Toutes'],['brouillon','Brouillons'],['envoyee','Envoyees'],['non_payee','Non payees'],['payee','Payees'],['annulee','Annulees']].map(([v,l])=>(
          <button key={v} onClick={()=>setFiltre(v)} style={{padding:'6px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontSize:'13px',background:filtre===v?'#1a1a2e':'#eee',color:filtre===v?'white':'#555'}}>{l}</button>
        ))}
      </div>
      <div style={{marginBottom:'16px'}}>
        <input placeholder="Rechercher par numero, client ou reference..." value={recherche}
          onChange={e=>setRecherche(e.target.value)}
          style={{width:'100%',padding:'10px 14px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px',boxSizing:'border-box'}}/>
      </div>
      <div style={{background:'white',borderRadius:'8px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',overflow:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:'800px'}}>
          <thead><tr style={{background:'#f8f8f8'}}>
            {['Numero','Client','Date','Echeance','Total','Statut','Actions'].map(h=>(
              <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:'12px',color:'#666',fontWeight:'600',borderBottom:'1px solid #eee'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtrees.map((f,i)=>(
              <tr key={f.id} style={{background:i%2===0?'white':'#fafafa'}}>
                <td style={{padding:'12px 16px'}}>
                  <button onClick={()=>onNav('detail-facture',f.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#1a1a2e',fontWeight:'600',fontSize:'14px',padding:0}}>{f.numero}</button>
                </td>
                <td style={{padding:'12px 16px',fontSize:'13px'}}>{f.client_nom}</td>
                <td style={{padding:'12px 16px',fontSize:'13px',color:'#666'}}>{fmtDate(f.date_facture)}</td>
                <td style={{padding:'12px 16px',fontSize:'13px',color:f.statut==='envoyee'&&new Date(f.date_echeance)<new Date()?'#ef4444':'#666'}}>{fmtDate(f.date_echeance)}</td>
                <td style={{padding:'12px 16px',fontSize:'13px',fontWeight:'600'}}>{fmt(f.total,f.devise)}</td>
                <td style={{padding:'12px 16px'}}>
                  <select value={f.statut} onChange={e=>changer(f.id,e.target.value)} style={{padding:'3px 8px',borderRadius:'12px',border:'none',fontSize:'12px',fontWeight:'600',background:STATUTS[f.statut]+'22',color:STATUTS[f.statut],cursor:'pointer'}}>
                    {Object.entries(LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                  </select>
                </td>
                <td style={{padding:'12px 16px'}}>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={()=>onNav('modifier-facture',f.id)} style={{background:'#1a1a2e',color:'white',border:'none',padding:'5px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>Modifier</button>
                    <button onClick={()=>ouvrirPdf(f.id)} style={{background:'#e91e8c',color:'white',border:'none',padding:'5px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>PDF</button>
                    <button onClick={()=>supprimer(f.id)} style={{background:'#fee',color:'#e11',border:'1px solid #fcc',padding:'5px 10px',borderRadius:'4px',cursor:'pointer',fontSize:'12px'}}>x</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrees.length===0 && <div style={{textAlign:'center',padding:'40px',color:'#aaa'}}>Aucune facture</div>}
      </div>
    </div>
  )
}
