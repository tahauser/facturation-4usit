const router = require('express').Router();
const pool = require('../models/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM clients WHERE actif=true ORDER BY nom');
  res.json(r.rows);
});

router.post('/', auth, async (req, res) => {
  const { nom, adresse, ville, pays, email, telephone, ice, devise, langue } = req.body;
  const r = await pool.query(
    'INSERT INTO clients(nom,adresse,ville,pays,email,telephone,ice,devise,langue) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
    [nom, adresse, ville, pays, email, telephone, ice, devise||'CAD', langue||'fr']
  );
  res.json(r.rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  const { nom, adresse, ville, pays, email, telephone, ice, devise, langue } = req.body;
  const r = await pool.query(
    'UPDATE clients SET nom=$1,adresse=$2,ville=$3,pays=$4,email=$5,telephone=$6,ice=$7,devise=$8,langue=$9 WHERE id=$10 RETURNING *',
    [nom, adresse, ville, pays, email, telephone, ice, devise, langue, req.params.id]
  );
  res.json(r.rows[0]);
});

router.delete('/:id', auth, async (req, res) => {
  await pool.query('UPDATE clients SET actif=false WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
