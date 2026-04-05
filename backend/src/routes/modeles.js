const router = require('express').Router();
const pool = require('../models/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM modeles WHERE actif=true ORDER BY nom');
  res.json(r.rows);
});

router.post('/', auth, async (req, res) => {
  const { nom, description, style } = req.body;
  const r = await pool.query(
    'INSERT INTO modeles(nom,description,style) VALUES($1,$2,$3) RETURNING *',
    [nom, description, JSON.stringify(style||{})]
  );
  res.json(r.rows[0]);
});

router.put('/:id', auth, async (req, res) => {
  const { nom, description, style } = req.body;
  const r = await pool.query(
    'UPDATE modeles SET nom=$1,description=$2,style=$3 WHERE id=$4 RETURNING *',
    [nom, description, JSON.stringify(style||{}), req.params.id]
  );
  res.json(r.rows[0]);
});

router.delete('/:id', auth, async (req, res) => {
  await pool.query('UPDATE modeles SET actif=false WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
