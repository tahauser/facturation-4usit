const router = require('express').Router();
const pool = require('../models/db');
const auth = require('../middleware/auth');
const { genererPDF } = require('../services/pdf');

// Générer numéro auto
async function prochainNumero() {
  const annee = new Date().getFullYear();
  await pool.query('INSERT INTO compteurs(annee,sequence) VALUES($1,0) ON CONFLICT(annee) DO NOTHING', [annee]);
  const r = await pool.query('UPDATE compteurs SET sequence=sequence+1 WHERE annee=$1 RETURNING sequence', [annee]);
  const seq = String(r.rows[0].sequence).padStart(3, '0');
  return `INV/${annee}/${seq}`;
}

// Liste
router.get('/', auth, async (req, res) => {
  const r = await pool.query(`
    SELECT f.*, c.nom as client_nom, m.nom as modele_nom
    FROM factures f
    JOIN clients c ON c.id=f.client_id
    JOIN modeles m ON m.id=f.modele_id
    ORDER BY f.cree_le DESC
  `);
  res.json(r.rows);
});

// Détail
router.get('/:id', auth, async (req, res) => {
  const f = await pool.query(`
    SELECT f.*, c.*, c.nom as client_nom, c.id as client_id, m.nom as modele_nom, m.style as modele_style, m.id as modele_id
    FROM factures f
    JOIN clients c ON c.id=f.client_id
    JOIN modeles m ON m.id=f.modele_id
    WHERE f.id=$1
  `, [req.params.id]);
  if (!f.rows.length) return res.status(404).json({ error: 'Facture introuvable' });
  const lignes = await pool.query('SELECT * FROM lignes_facture WHERE facture_id=$1 ORDER BY ordre', [req.params.id]);
  const paiements = await pool.query('SELECT * FROM paiements WHERE facture_id=$1 ORDER BY date_paiement', [req.params.id]);
  res.json({ ...f.rows[0], lignes: lignes.rows, paiements: paiements.rows });
});

// Créer
router.post('/', auth, async (req, res) => {
  const { client_id, modele_id, date_facture, date_echeance, reference, lignes, notes, conditions, devise, taux_tva } = req.body;
  const numero = await prochainNumero();
  const sous_total = lignes.reduce((s, l) => s + (l.quantite * l.prix_unitaire), 0);
  const tva = parseFloat(taux_tva) || 0;
  const montant_tva = sous_total * tva / 100;
  const total = sous_total + montant_tva;

  const f = await pool.query(
    `INSERT INTO factures(numero,client_id,modele_id,date_facture,date_echeance,reference,sous_total,taux_tva,montant_tva,total,devise,notes,conditions,statut)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'brouillon') RETURNING *`,
    [numero, client_id, modele_id, date_facture, date_echeance, reference, sous_total, tva, montant_tva, total, devise||'CAD', notes, conditions||'30 jours']
  );
  const fac = f.rows[0];

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    const lt = l.quantite * l.prix_unitaire;
    await pool.query(
      'INSERT INTO lignes_facture(facture_id,description,quantite,prix_unitaire,taux_tva,total,ordre) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [fac.id, l.description, l.quantite, l.prix_unitaire, tva, lt, i]
    );
  }
  res.json(fac);
});

// Modifier
router.put('/:id', auth, async (req, res) => {
  const { client_id, modele_id, date_facture, date_echeance, reference, lignes, notes, conditions, devise, taux_tva, statut } = req.body;
  const sous_total = lignes.reduce((s, l) => s + (l.quantite * l.prix_unitaire), 0);
  const tva = parseFloat(taux_tva) || 0;
  const montant_tva = sous_total * tva / 100;
  const total = sous_total + montant_tva;

  await pool.query(
    `UPDATE factures SET client_id=$1,modele_id=$2,date_facture=$3,date_echeance=$4,reference=$5,
     sous_total=$6,taux_tva=$7,montant_tva=$8,total=$9,devise=$10,notes=$11,conditions=$12,statut=$13,modifie_le=NOW()
     WHERE id=$14`,
    [client_id, modele_id, date_facture, date_echeance, reference, sous_total, tva, montant_tva, total, devise, notes, conditions, statut||'brouillon', req.params.id]
  );
  await pool.query('DELETE FROM lignes_facture WHERE facture_id=$1', [req.params.id]);
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    await pool.query(
      'INSERT INTO lignes_facture(facture_id,description,quantite,prix_unitaire,taux_tva,total,ordre) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [req.params.id, l.description, l.quantite, l.prix_unitaire, tva, l.quantite*l.prix_unitaire, i]
    );
  }
  res.json({ ok: true });
});

// Supprimer
router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM factures WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// Changer statut
router.patch('/:id/statut', auth, async (req, res) => {
  const { statut } = req.body;
  await pool.query('UPDATE factures SET statut=$1,modifie_le=NOW() WHERE id=$2', [statut, req.params.id]);
  res.json({ ok: true });
});

// Ajouter paiement
router.post('/:id/paiements', auth, async (req, res) => {
  const { date_paiement, montant, mode, reference, notes } = req.body;
  const r = await pool.query(
    'INSERT INTO paiements(facture_id,date_paiement,montant,mode,reference,notes) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.params.id, date_paiement, montant, mode, reference, notes]
  );
  // Vérifier si totalement payée
  const total = await pool.query('SELECT total FROM factures WHERE id=$1', [req.params.id]);
  const paie = await pool.query('SELECT SUM(montant) as s FROM paiements WHERE facture_id=$1', [req.params.id]);
  if (parseFloat(paie.rows[0].s) >= parseFloat(total.rows[0].total))
    await pool.query("UPDATE factures SET statut='payee' WHERE id=$1", [req.params.id]);
  res.json(r.rows[0]);
});

// Générer PDF
router.get('/:id/pdf', async (req, res) => {
  // Accepter token en query string pour les liens directs
  const token = req.query.token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET);
  } catch { return res.status(401).json({ error: 'Token invalide' }); }
  const f = await pool.query(`
    SELECT f.*, c.nom as client_nom, c.adresse as client_adresse, c.ville as client_ville,
           c.pays as client_pays, c.ice as client_ice, c.telephone as client_telephone,
           m.nom as modele_nom, m.style as modele_style
    FROM factures f JOIN clients c ON c.id=f.client_id JOIN modeles m ON m.id=f.modele_id
    WHERE f.id=$1
  `, [req.params.id]);
  if (!f.rows.length) return res.status(404).json({ error: 'Introuvable' });
  const lignes = await pool.query('SELECT * FROM lignes_facture WHERE facture_id=$1 ORDER BY ordre', [req.params.id]);
  const facture = { ...f.rows[0], lignes: lignes.rows };
  try {
    const pdf = await genererPDF(facture);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${facture.numero}.pdf"`);
    res.send(pdf);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
