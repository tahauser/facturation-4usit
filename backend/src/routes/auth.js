const router = require('express').Router();
const pool = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  try {
    const r = await pool.query('SELECT * FROM utilisateurs WHERE email=$1', [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'Identifiants invalides' });
    const u = r.rows[0];
    if (!await bcrypt.compare(mot_de_passe, u.mot_de_passe_hash))
      return res.status(401).json({ error: 'Identifiants invalides' });
    const token = jwt.sign({ id: u.id, email: u.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ token, user: { id: u.id, email: u.email, nom: u.nom } });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
