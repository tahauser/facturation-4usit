const PDFDocument = require('pdfkit');

function formatMontant(n, devise) {
  return parseFloat(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace('.', ',') + ' ' + (devise||'');
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('fr-FR');
}

function nombreEnLettres(n, devise) {
  const unites = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
    'dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
  const dizaines = ['','','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
  function cent(n) {
    if (n < 20) return unites[n];
    const d = Math.floor(n/10), u = n%10;
    if (d===6||d===8) return dizaines[d]+(u>0?'-'+unites[10+u]:(d===8&&u===0?'s':''));
    return dizaines[d]+(u===1&&d!==8?'-et-un':u>0?'-'+unites[u]:(d===8?'s':''));
  }
  function grp(n) {
    if (n===0) return '';
    if (n<100) return cent(n);
    const c=Math.floor(n/100),r=n%100;
    return (c===1?'cent':unites[c]+'-cent')+(r===0&&c>1?'s':'')+(r>0?' '+cent(r):'');
  }
  const entier = Math.floor(n);
  const milliers = Math.floor(entier/1000);
  const reste = entier%1000;
  let res = milliers>0 ? (milliers===1?'mille':grp(milliers)+' mille')+(reste>0?' '+grp(reste):'') : grp(reste);
  res = res.charAt(0).toUpperCase()+res.slice(1);
  const nd = devise==='DH'?['dirham','dirhams']:devise==='EUR'?['euro','euros']:['dollar','dollars'];
  return res+' '+(entier>1?nd[1]:nd[0]);
}

async function genererPDF(facture) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const style = facture.modele_style || {};
    const isFCZ = style.type === 'FCZ';
    const rose = '#e91e8c';
    const noir = '#1a1a2e';

    // ===== HEADER =====
    doc.fontSize(26).font('Helvetica-Bold').fillColor(noir).text('4USiT', 50, 45);
    doc.fontSize(8).font('Helvetica').fillColor('#666')
       .text('46 BD ZERKTOUNI APPT 6, 2 EME ETG, 20140 CASABLANCA, Maroc', 50, 78)
       .text('RC : 567013 — ICE: 003183286000068', 50, 89)
       .text(isFCZ
         ? 'RIB (Attijari Wafa Bank) : 190780212111697832000482'
         : 'RIB (Attijariwabank) : 007 810 0014995000001354 30', 50, 100);

    doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#ddd').lineWidth(1).stroke();

    // ===== CLIENT =====
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#999').text('LIVRÉ À', 50, 125);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(noir).text(facture.client_nom||'', 50, 137);
    let yc = 150;
    doc.fontSize(8).font('Helvetica').fillColor('#555');
    if (facture.client_adresse) { doc.text(facture.client_adresse, 50, yc, {width:240}); yc += 11; }
    const vp = [facture.client_ville, facture.client_pays].filter(Boolean).join(' ');
    if (vp) { doc.text(vp, 50, yc); yc += 11; }
    if (facture.client_ice) { doc.text('ICE : '+facture.client_ice, 50, yc); yc += 11; }
    if (facture.client_telephone) { doc.text(facture.client_telephone, 50, yc); }

    // ===== NUMÉRO + DATES =====
    doc.fontSize(15).font('Helvetica-Bold').fillColor(rose).text('Facture '+facture.numero, 50, 205);

    doc.fontSize(8).font('Helvetica').fillColor('#666');
    doc.text('Date de la facture :', 50, 226).fillColor(noir).text(formatDate(facture.date_facture), 165, 226);
    doc.fillColor('#666').text("Date d'échéance :", 50, 238).fillColor(noir).text(formatDate(facture.date_echeance), 165, 238);
    if (facture.reference) {
      doc.fillColor('#666').text('Référence :', 50, 250).fillColor(noir).text(facture.reference, 165, 250);
    }

    // ===== TABLEAU =====
    const tTop = 268;
    const cDesc=50, cQte=320, cPU=368, cTVA=430, cTot=490;

    doc.rect(50, tTop, 495, 20).fill('#f5f5f5');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#444');
    doc.text('DESCRIPTION', cDesc+3, tTop+6, {width:260});
    doc.text('QTÉ', cQte, tTop+6, {width:40, align:'center'});
    doc.text('PRIX UNIT.', cPU, tTop+6, {width:58, align:'right'});
    doc.text('TAXES', cTVA, tTop+6, {width:52, align:'center'});
    doc.text('TOTAL', cTot, tTop+6, {width:55, align:'right'});

    let y = tTop + 20;
    (facture.lignes||[]).forEach((l,i) => {
      const h = 26;
      doc.rect(50, y, 495, h).fill(i%2===0?'#fff':'#fafafa');
      doc.moveTo(50,y+h).lineTo(545,y+h).strokeColor('#eee').lineWidth(0.5).stroke();
      const tva = parseFloat(l.taux_tva||facture.taux_tva||0);
      const tvaFmt = tva%1===0?parseInt(tva):tva;
      doc.fontSize(8).font('Helvetica').fillColor(noir);
      doc.text((l.description||'').substring(0,70), cDesc+3, y+5, {width:262, lineBreak:false});
      doc.text(String(parseFloat(l.quantite||0)), cQte, y+9, {width:40, align:'center', lineBreak:false});
      doc.text(formatMontant(l.prix_unitaire, facture.devise), cPU, y+9, {width:58, align:'right', lineBreak:false});
      doc.text('TVA '+tvaFmt+'%', cTVA, y+9, {width:52, align:'center', lineBreak:false});
      doc.font('Helvetica-Bold').text(formatMontant(l.total, facture.devise), cTot, y+9, {width:55, align:'right', lineBreak:false});
      y += h;
    });

    // ===== TOTAUX =====
    y += 8;
    const tx=310, tw=235, wv=tw-16;
    const tva2 = parseFloat(facture.taux_tva||0);
    const tva2Fmt = tva2%1===0?parseInt(tva2):tva2;

    // Sous-total
    doc.rect(tx, y, tw, 18).fill('#f5f5f5');
    doc.fontSize(8).font('Helvetica').fillColor('#666').text('Sous-Total', tx+8, y+5, {width:100, lineBreak:false});
    doc.font('Helvetica-Bold').fillColor(noir).text(formatMontant(facture.sous_total, facture.devise), tx+8, y+5, {width:wv, align:'right', lineBreak:false});
    y += 18;

    // TVA
    doc.rect(tx, y, tw, 18).fill('white');
    doc.moveTo(tx,y).lineTo(tx+tw,y).strokeColor('#eee').lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#666').text('TVA '+tva2Fmt+'%', tx+8, y+5, {width:100, lineBreak:false});
    doc.font('Helvetica').fillColor(noir).text(formatMontant(facture.montant_tva, facture.devise), tx+8, y+5, {width:wv, align:'right', lineBreak:false});
    y += 18;

    // Total
    doc.rect(tx, y, tw, 24).fill(rose);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white').text('Total', tx+8, y+7, {width:100, lineBreak:false});
    doc.text(formatMontant(facture.total, facture.devise), tx+8, y+7, {width:wv, align:'right', lineBreak:false});
    y += 32;

    // ===== MONTANT EN LETTRES =====
    doc.fontSize(8).font('Helvetica').fillColor('#555')
       .text('Arrêté la présente facture à la somme de ', 50, y, {continued:true})
       .font('Helvetica-Bold').fillColor(noir)
       .text(nombreEnLettres(parseFloat(facture.total||0), facture.devise));
    y += 20;

    // ===== COMMUNICATION =====
    doc.fontSize(8).font('Helvetica').fillColor('#555')
       .text('Merci d\'utiliser la communication suivante pour votre paiement : ', 50, y, {continued:true})
       .font('Helvetica-Bold').fillColor(noir).text(facture.numero);
    y += 13;
    doc.font('Helvetica').fillColor('#666').text('Conditions de règlement : '+(facture.conditions||'30 jours'), 50, y);

    // ===== FOOTER FIXE =====
    doc.moveTo(50, 758).lineTo(545, 758).strokeColor('#ddd').lineWidth(0.5).stroke();
    const ribTxt = isFCZ
      ? 'RC : 567013 IF : 53537615 - RIB (Attijari Wafa Bank) : 190780212111697832000482'
      : 'RC : 567013 - ICE: 003183286000068 - RIB (Attijariwabank) : 007 810 0014995000001354 30';
    doc.fontSize(7).fillColor('#999')
       .text(ribTxt, 50, 762, {align:'center', width:495, lineBreak:false});
    doc.text('46 BD ZERKTOUNI 2eme etage Appt N6 Casablanca, Maroc  —  Page: 1 / 1', 50, 772, {align:'center', width:495, lineBreak:false});

    doc.end();
  });
}

module.exports = { genererPDF };
