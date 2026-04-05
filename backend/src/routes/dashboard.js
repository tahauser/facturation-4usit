const router = require('express').Router();
const pool = require('../models/db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const [parDevise, enRetard, parMois] = await Promise.all([
      pool.query(`
        SELECT devise,
          COUNT(*) as total_nb,
          SUM(total) as total_montant,
          SUM(CASE WHEN statut='envoyee' THEN 1 ELSE 0 END) as attente_nb,
          SUM(CASE WHEN statut='envoyee' THEN total ELSE 0 END) as attente_montant,
          SUM(CASE WHEN statut='payee' THEN 1 ELSE 0 END) as payee_nb,
          SUM(CASE WHEN statut='payee' THEN total ELSE 0 END) as payee_montant,
          SUM(CASE WHEN statut='brouillon' THEN 1 ELSE 0 END) as brouillon_nb,
          SUM(CASE WHEN statut='brouillon' THEN total ELSE 0 END) as brouillon_montant
        FROM factures
        GROUP BY devise
        ORDER BY devise
      `),
      pool.query(`
        SELECT devise, COUNT(*) as nb, SUM(total) as montant
        FROM factures
        WHERE statut='envoyee' AND date_echeance < NOW()
        GROUP BY devise
      `),
      pool.query(`
        SELECT TO_CHAR(date_facture,'YYYY-MM') as mois, devise,
          SUM(total) as montant, COUNT(*) as nb
        FROM factures
        WHERE date_facture >= NOW() - INTERVAL '12 months'
        GROUP BY mois, devise
        ORDER BY mois, devise
      `)
    ]);

    res.json({
      parDevise: parDevise.rows,
      enRetard: enRetard.rows,
      parMois: parMois.rows
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
