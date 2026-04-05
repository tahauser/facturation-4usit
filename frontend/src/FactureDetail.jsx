import { useState, useEffect } from 'react'
import api from './api'
const S = {padding:'8px',border:'1px solid #ddd',borderRadius:'4px',fontSize:'13px',width:'100%',boxSizing:'border-box'}
const STATUTS = {brouillon:'#94a3b8',envoyee:'#f59e0b',payee:'#10b981',annulee:'#ef4444'}
export default function FactureDetail({id,onNav}) {
  const [f,setF] = useState(null)
  const [paiement,setPaiement] = useState({date_paiement:new Date().toISOString().split('T')[0],montant:'',mode:'Virement',reference:''})
  const [showP,setShowP] = useState(false)
  const charger = () => api.get(`/factures/${id}`).then(r=>setF(r.data))
  useEffect(()=>{charger()},[id])
  const ajouterPaiement = async () => { await api.post(`/factures/${id}/paiements`,paiement); setShowP(false); charger() }
  if (!f) return <div style={{padding:'40px',textAlign:'center',color:'#888'}}>Chargement...</div>
  const fmt = n => parseFloat(n||0).toLocaleString('fr-FR',{minimumFractionDigits:2})
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
  const totalPaye = f.paiements?.reduce((s,p)=>s+parseFloat(p.montant),0)||0
  const reste = parseFloat(f.total)-totalPaye
  return (
    <div style={{maxWidth:'900px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h2 style={{margin:0,color:'#1a1a2e'}}>{f.numero}</h2>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={()=>onNav('modifier-facture',id)} style={{background:'#1a1a2e',color:'white',border:'none',padding:'8px 16px',borderRadius:'4px',cursor:'pointer',fontSize:'13px'}}>Modifier</button>
          <button onClick={()=>{const t=localStorage.getItem('token');window.open(`/api/factures/${id}/pdf?token=${t}`,'_blank')}} style={{background:'#e91e8c',color:'white',border:'none',padding:'8px 16px',borderRadius:'4px',cursor:'pointer',fontSize:'13px'}}>↓ PDF</button>
          <button onClick={()=>onNav('factures')} style={{background:'#eee',border:'none',padding:'8px 16px',borderRadius:'4px',cursor:'pointer',fontSize:'13px'}}>← Retour</button>
        </div>
      </div>
      <div style={{background:'white',borderRadius:'8px',padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',marginBottom:'16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'20px'}}>
          {[['Client',f.client_nom],['Date',fmtDate(f.date_facture)],['Echeance',fmtDate(f.date_echeance)],['Reference',f.reference||'—'],['Modele',f.modele_nom]].map(([l,v])=>(
            <div key={l}><div style={{fontSize:'11px',color:'#999',textTransform:'uppercase'}}>{l}</div><div style={{marginTop:'4px',fontSize:'14px'}}>{v}</div></div>
          ))}
          <div><div style={{fontSize:'11px',color:'#999',textTransform:'uppercase'}}>Statut</div>
            <div style={{marginTop:'4px'}}><span style={{background:STATUTS[f.statut]+'22',color:STATUTS[f.statut],padding:'3px 10px',borderRadius:'10px',fontSize:'12px',fontWeight:'bold'}}>{f.statut}</span></div>
          </div>
        </div>
      </div>
      <div style={{background:'white',borderRadius:'8px',padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',marginBottom:'16px'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'#f8f8f8'}}>
            {['Description','Qte','Prix unit.','Total'].map(h=>(
              <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:'12px',color:'#666',borderBottom:'1px solid #eee'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {f.lignes?.map((l,i)=>(
              <tr key={i} style={{borderBottom:'1px solid #f5f5f5'}}>
                <td style={{padding:'10px 12px',fontSize:'13px'}}>{l.description}</td>
                <td style={{padding:'10px 12px',fontSize:'13px'}}>{l.quantite}</td>
                <td style={{padding:'10px 12px',fontSize:'13px'}}>{fmt(l.prix_unitaire)} {f.devise}</td>
                <td style={{padding:'10px 12px',fontSize:'13px',fontWeight:'600'}}>{fmt(l.total)} {f.devise}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{float:'right',width:'250px',marginTop:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:'13px',borderBottom:'1px solid #eee'}}><span style={{color:'#666'}}>Sous-total</span><span>{fmt(f.sous_total)} {f.devise}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:'13px',borderBottom:'1px solid #eee'}}><span style={{color:'#666'}}>TVA {f.taux_tva}%</span><span>{fmt(f.montant_tva)} {f.devise}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',fontSize:'16px',fontWeight:'bold',color:'#1a1a2e'}}><span>Total</span><span>{fmt(f.total)} {f.devise}</span></div>
        </div>
        <div style={{clear:'both'}}/>
      </div>
      <div style={{background:'white',borderRadius:'8px',padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <h3 style={{margin:0,fontSize:'14px',color:'#555',textTransform:'uppercase'}}>Paiements</h3>
          <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
            <span style={{fontSize:'13px',color:reste>0?'#f59e0b':'#10b981',fontWeight:'bold'}}>Reste: {fmt(reste)} {f.devise}</span>
            <button onClick={()=>setShowP(!showP)} style={{background:'#10b981',color:'white',border:'none',padding:'6px 14px',borderRadius:'4px',cursor:'pointer',fontSize:'13px'}}>+ Paiement</button>
          </div>
        </div>
        {showP && (
          <div style={{background:'#f9f9f9',padding:'16px',borderRadius:'6px',marginBottom:'16px',display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',gap:'10px',alignItems:'end'}}>
            {[['date','date_paiement','Date'],['number','montant','Montant'],['text','mode','Mode'],['text','reference','Reference']].map(([t,k,l])=>(
              <div key={k}>
                <label style={{fontSize:'11px',color:'#666',display:'block',marginBottom:'3px'}}>{l}</label>
                <input type={t} style={S} value={paiement[k]} onChange={e=>setPaiement({...paiement,[k]:e.target.value})}/>
              </div>
            ))}
            <button onClick={ajouterPaiement} style={{background:'#10b981',color:'white',border:'none',padding:'8px 16px',borderRadius:'4px',cursor:'pointer',fontWeight:'bold'}}>OK</button>
          </div>
        )}
        {f.paiements?.length>0
          ? <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#f8f8f8'}}>
                {['Date','Montant','Mode','Reference'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'12px',color:'#666',borderBottom:'1px solid #eee'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {f.paiements.map(p=>(
                  <tr key={p.id} style={{borderBottom:'1px solid #f5f5f5'}}>
                    <td style={{padding:'8px 12px',fontSize:'13px'}}>{fmtDate(p.date_paiement)}</td>
                    <td style={{padding:'8px 12px',fontSize:'13px',fontWeight:'600',color:'#10b981'}}>{fmt(p.montant)} {f.devise}</td>
                    <td style={{padding:'8px 12px',fontSize:'13px',color:'#666'}}>{p.mode}</td>
                    <td style={{padding:'8px 12px',fontSize:'13px',color:'#666'}}>{p.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          : <div style={{textAlign:'center',color:'#aaa',padding:'20px',fontSize:'13px'}}>Aucun paiement</div>
        }
      </div>
    </div>
  )
}
