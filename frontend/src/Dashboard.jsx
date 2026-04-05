import { useState, useEffect } from 'react'
import api from './api'

const DEVISES = {
  DH:  { label: 'Dirham',        couleur: '#10b981', symbol: 'DH' },
  CAD: { label: 'Dollar canadien', couleur: '#3b82f6', symbol: 'CAD' },
  EUR: { label: 'Euro',           couleur: '#8b5cf6', symbol: '€' },
}

function fmt(n, devise) {
  if (!n || parseFloat(n) === 0) return '0,00 ' + (devise||'')
  return parseFloat(n).toLocaleString('fr-FR', {minimumFractionDigits:2}) + ' ' + (devise||'')
}

function CarteDevise({ d }) {
  const cfg = DEVISES[d.devise] || { label: d.devise, couleur: '#888', symbol: d.devise }
  return (
    <div style={{background:'white',borderRadius:'8px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',borderTop:`4px solid ${cfg.couleur}`}}>
      <div style={{fontSize:'15px',fontWeight:'bold',color:cfg.couleur,marginBottom:'16px'}}>{cfg.label}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
        <div style={{background:'#f9f9f9',borderRadius:'6px',padding:'12px'}}>
          <div style={{fontSize:'11px',color:'#999',textTransform:'uppercase',marginBottom:'4px'}}>Total</div>
          <div style={{fontSize:'22px',fontWeight:'bold',color:'#1a1a2e'}}>{d.total_nb}</div>
          <div style={{fontSize:'12px',color:'#888',marginTop:'2px'}}>{fmt(d.total_montant, d.devise)}</div>
        </div>
        <div style={{background:'#fffbeb',borderRadius:'6px',padding:'12px'}}>
          <div style={{fontSize:'11px',color:'#999',textTransform:'uppercase',marginBottom:'4px'}}>En attente</div>
          <div style={{fontSize:'22px',fontWeight:'bold',color:'#f59e0b'}}>{d.attente_nb}</div>
          <div style={{fontSize:'12px',color:'#888',marginTop:'2px'}}>{fmt(d.attente_montant, d.devise)}</div>
        </div>
        <div style={{background:'#f0fdf4',borderRadius:'6px',padding:'12px'}}>
          <div style={{fontSize:'11px',color:'#999',textTransform:'uppercase',marginBottom:'4px'}}>Payées</div>
          <div style={{fontSize:'22px',fontWeight:'bold',color:'#10b981'}}>{d.payee_nb}</div>
          <div style={{fontSize:'12px',color:'#888',marginTop:'2px'}}>{fmt(d.payee_montant, d.devise)}</div>
        </div>
        <div style={{background:'#f8f8f8',borderRadius:'6px',padding:'12px'}}>
          <div style={{fontSize:'11px',color:'#999',textTransform:'uppercase',marginBottom:'4px'}}>Brouillons</div>
          <div style={{fontSize:'22px',fontWeight:'bold',color:'#94a3b8'}}>{d.brouillon_nb}</div>
          <div style={{fontSize:'12px',color:'#888',marginTop:'2px'}}>{fmt(d.brouillon_montant, d.devise)}</div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({onNav}) {
  const [data,setData] = useState(null)
  const [erreur,setErreur] = useState(null)

  useEffect(()=>{
    api.get('/dashboard')
      .then(r=>setData(r.data))
      .catch(e=>setErreur(e.message))
  },[])

  if (erreur) return <div style={{padding:'40px',color:'red'}}>Erreur: {erreur}</div>
  if (!data) return <div style={{padding:'40px',textAlign:'center',color:'#888'}}>Chargement...</div>

  // Graphique: grouper par mois, une barre par devise
  const moisSet = [...new Set(data.parMois.map(m=>m.mois))].sort()
  const deviseSet = [...new Set(data.parMois.map(m=>m.devise))]
  const maxMontant = Math.max(...data.parMois.map(m=>parseFloat(m.montant)||0), 1)

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h2 style={{margin:0,color:'#1a1a2e'}}>Tableau de bord</h2>
        <button onClick={()=>onNav('nouvelle-facture')} style={{background:'#e91e8c',color:'white',border:'none',padding:'10px 20px',borderRadius:'6px',cursor:'pointer',fontSize:'14px',fontWeight:'bold'}}>+ Nouvelle facture</button>
      </div>

      {/* Cartes par devise */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'20px',marginBottom:'30px'}}>
        {data.parDevise.map(d=><CarteDevise key={d.devise} d={d}/>)}
      </div>

      {/* Graphique par mois */}
      <div style={{background:'white',borderRadius:'8px',padding:'24px',boxShadow:'0 1px 4px rgba(0,0,0,0.08)'}}>
        <h3 style={{margin:'0 0 8px',color:'#1a1a2e',fontSize:'15px'}}>Chiffre d'affaires par mois</h3>
        <div style={{display:'flex',gap:'16px',marginBottom:'16px'}}>
          {deviseSet.map(d=>(
            <div key={d} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'#666'}}>
              <div style={{width:'12px',height:'12px',borderRadius:'2px',background:DEVISES[d]?.couleur||'#888'}}/>
              {DEVISES[d]?.label||d}
            </div>
          ))}
        </div>
        {moisSet.length===0
          ? <div style={{textAlign:'center',color:'#aaa',padding:'40px'}}>Aucune donnée</div>
          : <div style={{overflowX:'auto'}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:'8px',minWidth:`${moisSet.length*80}px`,height:'200px',paddingBottom:'30px',position:'relative'}}>
                {moisSet.map(mois=>{
                  const donnesMois = data.parMois.filter(m=>m.mois===mois)
                  return (
                    <div key={mois} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',position:'relative'}}>
                      <div style={{display:'flex',alignItems:'flex-end',gap:'2px',height:'160px'}}>
                        {deviseSet.map(devise=>{
                          const d = donnesMois.find(m=>m.devise===devise)
                          const h = d ? Math.max(4,(parseFloat(d.montant)/maxMontant)*155) : 0
                          return (
                            <div key={devise} title={d?fmt(d.montant,devise):'0'} style={{width:'16px',height:`${h}px`,background:DEVISES[devise]?.couleur||'#888',borderRadius:'2px 2px 0 0',opacity:0.85,transition:'height 0.3s'}}/>
                          )
                        })}
                      </div>
                      <div style={{fontSize:'9px',color:'#888',position:'absolute',bottom:0,whiteSpace:'nowrap',transform:'rotate(-45deg)',transformOrigin:'top left',marginLeft:'8px'}}>{mois}</div>
                    </div>
                  )
                })}
              </div>
            </div>
        }
      </div>
    </div>
  )
}
